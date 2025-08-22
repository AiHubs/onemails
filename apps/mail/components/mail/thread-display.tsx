import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from 'next-themes';

import {
  ChevronLeft,
  ChevronRight,
  X,
  Reply,
  Archive,
  ThreeDots,
  Trash,
  Expand,
  ArchiveX,
  Forward,
  ReplyAll,
  Star,
  ExclamationCircle,
  Lightning,
  Folders,
  Sparkles,
  Mail,
} from '../icons/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  CircleAlertIcon,
  Inbox,
  ShieldAlertIcon,
  SidebarOpen,
  StopCircleIcon,
  Zap,
} from 'lucide-react';
import { moveThreadsTo, type ThreadDestination } from '@/lib/thread-actions';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMailNavigation } from '@/hooks/use-mail-navigation';
import { focusedIndexAtom } from '@/hooks/use-mail-navigation';
import { backgroundQueueAtom } from '@/store/backgroundQueue';
import { handleUnsubscribe } from '@/lib/email-utils.client';
import { useThread, useThreads } from '@/hooks/use-threads';
import { useAISidebar } from '@/components/ui/ai-sidebar';
import { useHotkeysContext } from 'react-hotkeys-hook';
import { MailDisplaySkeleton } from './mail-skeleton';
import { useTRPC } from '@/providers/query-provider';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { useStats } from '@/hooks/use-stats';
import ThreadSubject from './thread-subject';
import type { ParsedMessage } from '@/types';
import ReplyCompose from './reply-composer';
import { Separator } from '../ui/separator';
import { useMail } from '../mail/use-mail';
import { useTranslations } from 'use-intl';
import { NotesPanel } from './note-panel';
import { cn, FOLDERS } from '@/lib/utils';
import MailDisplay from './mail-display';
import { useQueryState } from 'nuqs';
import { useAtom } from 'jotai';
import { toast } from 'sonner';

interface ThreadDisplayProps {
  threadParam?: any;
  onClose?: () => void;
  isMobile?: boolean;
  messages?: ParsedMessage[];
  id?: string;
}

export function ThreadDemo({ messages, isMobile }: ThreadDisplayProps) {
  const isFullscreen = false;
  return (
    <div
      className={cn(
        'flex flex-col',
        isFullscreen ? 'h-screen' : isMobile ? 'h-full' : 'h-[calc(100dvh-2rem)]',
      )}
    >
      <div
        className={cn(
          'bg-offsetLight dark:bg-offsetDark relative flex flex-col overflow-hidden transition-all duration-300',
          isMobile ? 'h-full' : 'h-full',
          !isMobile && !isFullscreen && 'rounded-r-lg',
          isFullscreen ? 'fixed inset-0 z-50' : '',
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1" type="scroll">
            <div className="pb-4">
              {[...(messages || [])].reverse().map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    'transition-all duration-200',
                    index > 0 && 'border-border border-t',
                  )}
                >
                  <MailDisplay
                    demo
                    emailData={message}
                    isFullscreen={isFullscreen}
                    isMuted={false}
                    isLoading={false}
                    index={index}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function ThreadActionButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  className,
}: {
  icon: React.ComponentType<React.ComponentPropsWithRef<any>> & {
    startAnimation?: () => void;
    stopAnimation?: () => void;
  };
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const iconRef = useRef<any>(null);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            disabled={disabled}
            onClick={onClick}
            variant="ghost"
            className={cn('md:h-fit md:px-2', className)}
            onMouseEnter={() => iconRef.current?.startAnimation?.()}
            onMouseLeave={() => iconRef.current?.stopAnimation?.()}
          >
            <Icon ref={iconRef} className="dark:fill-iconDark fill-iconLight" />
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        {/* <TooltipContent>{label}</TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
}

export function ThreadDisplay() {
  const isMobile = useIsMobile();
  const { toggleOpen: toggleAISidebar, open: isSidebarOpen } = useAISidebar();
  const params = useParams<{ folder: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const folder = params?.folder ?? 'inbox';
  const [id, setThreadId] = useQueryState('threadId');
  const { data: emailData, isLoading, refetch: refetchThread } = useThread(id ?? null);
  const [{ refetch: mutateThreads }, items] = useThreads();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const t = useTranslations();
  const { refetch: refetchStats } = useStats();
  const [mode, setMode] = useQueryState('mode');
  const [, setBackgroundQueue] = useAtom(backgroundQueueAtom);
  const [activeReplyId, setActiveReplyId] = useQueryState('activeReplyId');
  const [, setDraftId] = useQueryState('draftId');
  const { resolvedTheme } = useTheme();
  const [focusedIndex, setFocusedIndex] = useAtom(focusedIndexAtom);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutateAsync: toggleStar } = useMutation(trpc.mail.toggleStar.mutationOptions());
  const { mutateAsync: toggleImportant } = useMutation(trpc.mail.toggleImportant.mutationOptions());
  const invalidateCount = () =>
    queryClient.invalidateQueries({ queryKey: trpc.mail.count.queryKey() });
  const invalidateThread = () =>
    queryClient.invalidateQueries({ queryKey: trpc.mail.get.queryKey({ id: id ?? '' }) });
  const { mutateAsync: markAsRead } = useMutation(
    trpc.mail.markAsRead.mutationOptions({
      onSuccess: () => {
        return Promise.all([invalidateCount(), invalidateThread()]);
      },
    }),
  );
  const [, setIsComposeOpen] = useQueryState('isComposeOpen');
  const markAsReadRef = useRef<Promise<void> | null>(null);

  const handlePrevious = useCallback(() => {
    if (!id || !items.length || focusedIndex === null) return;
    if (focusedIndex > 0) {
      const prevThread = items[focusedIndex - 1];
      if (prevThread) {
        setThreadId(prevThread.id);
        setFocusedIndex(focusedIndex - 1);
      }
    }
  }, [items, id, focusedIndex, setThreadId, setFocusedIndex]);

  const handleNext = useCallback(() => {
    if (!id || !items.length || focusedIndex === null) return setThreadId(null);
    if (focusedIndex < items.length - 1) {
      const nextThread = items[focusedIndex + 1];
      if (nextThread) {
        setThreadId(nextThread.id);
        setActiveReplyId(null);
        setFocusedIndex(focusedIndex + 1);
      }
    }
  }, [items, id, focusedIndex, setThreadId, setActiveReplyId, setFocusedIndex]);

  useEffect(() => {
    if (!emailData || !id) return;

    const unreadEmails = emailData.messages.filter((e) => e.unread);
    if (unreadEmails.length === 0) return;

    const ids = [id, ...unreadEmails.map((e) => e.id)];

    const markAsReadPromise = markAsRead({ ids });
    markAsReadRef.current = markAsReadPromise;

    void markAsReadPromise.finally(() => {
      if (markAsReadRef.current === markAsReadPromise) {
        markAsReadRef.current = null;
      }
    });

    return () => {
      markAsReadRef.current = null;
    };
  }, [emailData, id]);

  const handleUnsubscribeProcess = () => {
    if (!emailData?.latest) return;
    toast.promise(handleUnsubscribe({ emailData: emailData.latest }), {
      success: 'Unsubscribed successfully!',
      error: 'Failed to unsubscribe',
    });
  };

  const isInArchive = folder === FOLDERS.ARCHIVE;
  const isInSpam = folder === FOLDERS.SPAM;
  const isInBin = folder === FOLDERS.BIN;
  const handleClose = useCallback(() => {
    setThreadId(null);
    setMode(null);
    setActiveReplyId(null);
    setDraftId(null);
  }, [setThreadId, setMode]);

  const moveThreadTo = useCallback(
    async (destination: ThreadDestination) => {
      if (!id) return;
      const promise = moveThreadsTo({
        threadIds: [id],
        currentFolder: folder,
        destination,
      });
      setBackgroundQueue({ type: 'add', threadId: `thread:${id}` });
      handleNext();

      toast.success(
        destination === 'inbox'
          ? t('common.actions.movedToInbox')
          : destination === 'spam'
            ? t('common.actions.movedToSpam')
            : destination === 'bin'
              ? t('common.actions.movedToBin')
              : t('common.actions.archived'),
      );
      toast.promise(promise, {
        error: t('common.actions.failedToMove'),
        finally: async () => {
          await Promise.all([refetchStats(), refetchThread()]);
          //   setBackgroundQueue({ type: 'delete', threadId: `thread:${threadId}` });
        },
      });
    },
    [id, folder, t],
  );

  // Add handleToggleStar function
  const handleToggleStar = useCallback(async () => {
    if (!emailData || !id) return;

    const newStarredState = !isStarred;
    setIsStarred(newStarredState);
    if (newStarredState) {
      toast.success(t('common.actions.addedToFavorites'));
    } else {
      toast.success(t('common.actions.removedFromFavorites'));
    }
    await toggleStar({ ids: [id] });
    await refetchThread();
  }, [emailData, id, isStarred]);

  const handleToggleImportant = useCallback(async () => {
    if (!emailData || !id) return;
    await toggleImportant({ ids: [id] });
    await refetchThread();
    if (isImportant) {
      toast.success(t('common.mail.markedAsImportant'));
    } else {
      toast.error('Failed to mark as important');
    }
  }, [emailData, id]);

  // Set initial star state based on email data
  useEffect(() => {
    if (emailData?.latest?.tags) {
      // Check if any tag has the name 'STARRED'
      setIsStarred(emailData.latest.tags.some((tag) => tag.name === 'STARRED'));
      setIsImportant(emailData.latest.tags.some((tag) => tag.name === 'IMPORTANT'));
    }
  }, [emailData?.latest?.tags]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleClose]);

  // When mode changes, set the active reply to the latest message
  useEffect(() => {
    // Only clear the active reply when mode is cleared
    // This prevents overriding the specifically selected message
    if (!mode) {
      setActiveReplyId(null);
    }
  }, [mode]);

  // Scroll to the active reply composer when it's opened
  useEffect(() => {
    if (mode && activeReplyId) {
      setTimeout(() => {
        const replyElement = document.getElementById(`reply-composer-${activeReplyId}`);
        if (replyElement) {
          replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100); // Short delay to ensure the component is rendered
    }
  }, [mode, activeReplyId]);

  return (
    <div
      className={cn(
        'flex flex-col',
        isFullscreen ? 'h-screen' : isMobile ? 'h-full' : 'h-[calc(100dvh-19px)] rounded-xl',
      )}
    >
      <div
        className={cn(
          'bg-panelLight dark:bg-panelDark relative flex flex-col overflow-hidden rounded-xl transition-all duration-300',
          isMobile ? 'h-full' : 'h-full',
          !isMobile && !isFullscreen && 'rounded-r-lg',
          isFullscreen ? 'fixed inset-0 z-50' : '',
        )}
      >
        {!id ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <img
                src={resolvedTheme === 'dark' ? '/empty-state.svg' : '/empty-state-light.svg'}
                alt="Empty Thread"
                width={200}
                height={200}
              />
              <div className="mt-5">
                <p className="text-lg">It's empty here</p>
                <p className="text-md text-[#6D6D6D] dark:text-white/50">
                  Choose an email to view details
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2 xl:grid-cols-2">
                  <button
                    onClick={toggleAISidebar}
                    className="inline-flex h-7 items-center justify-center gap-0.5 overflow-hidden rounded-lg border bg-white px-2 dark:border-none dark:bg-[#313131]"
                  >
                    <Sparkles className="mr-1 h-3.5 w-3.5 fill-[#959595]" />
                    <div className="flex items-center justify-center gap-2.5 px-0.5">
                      <div className="text-base-gray-950 justify-start text-sm leading-none">
                        Zero chat
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setIsComposeOpen('true')}
                    className="inline-flex h-7 items-center justify-center gap-0.5 overflow-hidden rounded-lg border bg-white px-2 dark:border-none dark:bg-[#313131]"
                  >
                    <Mail className="mr-1 h-3.5 w-3.5 fill-[#959595]" />
                    <div className="flex items-center justify-center gap-2.5 px-0.5">
                      <div className="dark:text-base-gray-950 justify-start text-sm leading-none">
                        Send email
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : !emailData || isLoading ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ScrollArea className="h-full flex-1" type="auto">
              <div className="pb-4">
                <MailDisplaySkeleton isFullscreen={isFullscreen} />
              </div>
            </ScrollArea>
          </div>
        ) : (
          <>
            <div
              className={cn(
                'flex flex-shrink-0 items-center border-b px-1 pb-1 md:px-3 md:pb-[11px] md:pt-[12px] dark:border-[#252525]',
                isMobile && 'bg-panelLight dark:bg-panelDark sticky top-0 z-10 mt-2',
              )}
            >
              <div className="flex flex-1 items-center gap-2">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleClose}
                        className="inline-flex h-7 w-7 items-center justify-center gap-1 overflow-hidden rounded-md hover:bg-white md:hidden dark:hover:bg-[#313131]"
                      >
                        <X className="fill-iconLight dark:fill-iconDark h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-white dark:bg-[#313131]">
                      {t('common.actions.close')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <ThreadActionButton
                  icon={X}
                  label={t('common.actions.close')}
                  onClick={handleClose}
                  className="hidden md:flex"
                />
                {/* <ThreadSubject subject={emailData.latest?.subject} /> */}
                <div className="dark:bg-iconDark/20 relative h-3 w-0.5 rounded-full bg-[#E7E7E7]" />{' '}
                <div className="flex items-center gap-1">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handlePrevious}
                          className="inline-flex h-7 w-7 items-center justify-center gap-1 overflow-hidden rounded-md hover:bg-white md:hidden dark:hover:bg-[#313131]"
                        >
                          <ChevronLeft className="fill-iconLight dark:fill-iconDark h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-white dark:bg-[#313131]">
                        Previous email
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <ThreadActionButton
                    icon={ChevronLeft}
                    label="Previous email"
                    onClick={handlePrevious}
                    className="hidden md:flex"
                  />
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleNext}
                          className="inline-flex h-7 w-7 items-center justify-center gap-1 overflow-hidden rounded-md hover:bg-white md:hidden dark:hover:bg-[#313131]"
                        >
                          <ChevronRight className="fill-iconLight dark:fill-iconDark h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-white dark:bg-[#313131]">
                        Next email
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <ThreadActionButton
                    icon={ChevronRight}
                    label="Next email"
                    onClick={handleNext}
                    className="hidden md:flex"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMode('replyAll');
                    setActiveReplyId(emailData?.latest?.id ?? '');
                  }}
                  className="inline-flex h-7 items-center justify-center gap-1 overflow-hidden rounded-md border bg-white px-1.5 dark:border-none dark:bg-[#313131]"
                >
                  <Reply className="fill-[#6D6D6D] dark:fill-[#9B9B9B]" />
                  <div className="flex items-center justify-center gap-2.5 pl-0.5 pr-1">
                    <div className="justify-start text-sm leading-none text-black dark:text-white">
                      Reply
                    </div>
                  </div>
                </button>
                <NotesPanel threadId={id} />
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleToggleStar}
                        className="inline-flex h-7 w-7 items-center justify-center gap-1 overflow-hidden rounded-md bg-white dark:bg-[#313131]"
                      >
                        <Star
                          className={cn(
                            'ml-[2px] mt-[2.4px] h-5 w-5',
                            isStarred
                              ? 'fill-yellow-400 stroke-yellow-400'
                              : 'fill-transparent stroke-[#9D9D9D] dark:stroke-[#9D9D9D]',
                          )}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-white dark:bg-[#313131]">
                      {isStarred
                        ? t('common.threadDisplay.unstar')
                        : t('common.threadDisplay.star')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => moveThreadTo('archive')}
                        className="inline-flex h-7 w-7 items-center justify-center gap-1 overflow-hidden rounded-md bg-white dark:bg-[#313131]"
                      >
                        <Archive className="fill-iconLight dark:fill-iconDark" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-white dark:bg-[#313131]">
                      {t('common.threadDisplay.archive')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {!isInBin && (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => moveThreadTo('bin')}
                          className="inline-flex h-7 w-7 items-center justify-center gap-1 overflow-hidden rounded-md border border-[#FCCDD5] bg-[#FDE4E9] dark:border-[#6E2532] dark:bg-[#411D23]"
                        >
                          <Trash className="fill-[#F43F5E]" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-white dark:bg-[#313131]">
                        {t('common.mail.moveToBin')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex h-7 w-7 items-center justify-center gap-1 overflow-hidden rounded-md bg-white dark:bg-[#313131]">
                      <ThreeDots className="fill-iconLight dark:fill-iconDark" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-[#313131]">
                    {/* <DropdownMenuItem onClick={() => setIsFullscreen(!isFullscreen)}>
                      <Expand className="fill-iconLight dark:fill-iconDark mr-2" />
                      <span>
                        {isFullscreen
                          ? t('common.threadDisplay.exitFullscreen')
                          : t('common.threadDisplay.enterFullscreen')}
                      </span>
                    </DropdownMenuItem> */}

                    {isInSpam || isInArchive || isInBin ? (
                      <DropdownMenuItem onClick={() => moveThreadTo('inbox')}>
                        <Inbox className="mr-2 h-4 w-4" />
                        <span>{t('common.mail.moveToInbox')}</span>
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => moveThreadTo('spam')}>
                          <ArchiveX className="fill-iconLight dark:fill-iconDark mr-2" />
                          <span>{t('common.threadDisplay.moveToSpam')}</span>
                        </DropdownMenuItem>
                        {emailData.latest?.listUnsubscribe ||
                        emailData.latest?.listUnsubscribePost ? (
                          <DropdownMenuItem onClick={handleUnsubscribeProcess}>
                            <Folders className="fill-iconLight dark:fill-iconDark mr-2" />
                            <span>Unsubscribe</span>
                          </DropdownMenuItem>
                        ) : null}
                      </>
                    )}
                    {!isImportant && (
                      <DropdownMenuItem onClick={handleToggleImportant}>
                        <Lightning className="fill-iconLight dark:fill-iconDark mr-2" />
                        {t('common.mail.markAsImportant')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className={cn('flex min-h-0 flex-1 flex-col', isMobile && 'h-full')}>
              <ScrollArea
                className={cn('flex-1', isMobile ? 'h-[calc(100%-1px)]' : 'h-full')}
                type="auto"
              >
                <div className="pb-4">
                  {(emailData.messages || []).map((message, index) => (
                    <div
                      key={message.id}
                      className={cn(
                        'transition-all duration-200',
                        index > 0 && 'border-border border-t',
                        mode && activeReplyId === message.id && '',
                      )}
                    >
                      <MailDisplay
                        emailData={message}
                        isFullscreen={isFullscreen}
                        isMuted={false}
                        isLoading={false}
                        index={index}
                        totalEmails={emailData?.totalReplies}
                      />
                      {mode && activeReplyId === message.id && (
                        <div className="px-4 py-2" id={`reply-composer-${message.id}`}>
                          <ReplyCompose messageId={message.id} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
