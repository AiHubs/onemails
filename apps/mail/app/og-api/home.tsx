import { ImageResponse, loadGoogleFont } from 'workers-og';
import mail from '../../public/white-icon.svg?url';

export async function loader() {
  try {
    const fontWeight400 = await loadGoogleFont({ family: 'Geist', weight: 400 });
    const fontWeight600 = await loadGoogleFont({ family: 'Geist', weight: 600 });

    return new ImageResponse(
      (
        <div tw="text-white bg-black w-full py-3 px-6 h-full flex items-center justify-center flex-col">
          <div tw="flex flex-col items-center justify-center">
            <div tw="flex mb-8 rounded-xl border-white p-4 items-center">
              <img src={mail} width="72" height="72" alt="mail" />
            </div>
            <div
              tw="flex flex-col items-center justify-center text-8xl"
              style={{ fontFamily: 'bold' }}
            >
              <div tw="flex">
                <span tw="text-[#fff]">The future of email</span>
              </div>
              <span tw="text-[#A1A1A1]">is here</span>
            </div>

            <div
              tw="text-[36px] text-center text-neutral-400 mt-10"
              style={{ fontFamily: 'light' }}
            >
              Experience email the way you want with 0 - the first open source email app that puts
              your privacy and safety first.
            </div>
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, #fff  100%, #ffff  100%)',
              width: '20rem',
              height: '20rem',
              filter: 'blur(180px)',
              borderRadius: '50%',
              display: 'flex',
              position: 'absolute',
              bottom: '-100px',
              left: '-40px',
              opacity: '0.18',
            }}
          ></div>
          <div
            style={{
              background: 'linear-gradient(135deg, #fff  100%, #fff  100%)',
              width: '20rem',
              height: '20rem',
              filter: 'blur(180px)',
              borderRadius: '50%',
              display: 'flex',
              position: 'absolute',
              top: '33%',
              right: '-40px',
              opacity: '0.26',
            }}
          ></div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'light',
            data: fontWeight400,
            style: 'normal',
            weight: 400,
          },
          {
            name: 'bold',
            data: fontWeight600,
            style: 'normal',
            weight: 600,
          },
        ],
      },
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
