import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';

const palette = {
  ink: '#141413',
  muted: '#73726c',
  page: '#f8f8f6',
  paper: '#ffffff',
  paperMuted: '#f3f1ec',
  line: 'rgba(31, 30, 29, 0.18)'
};

const shots = [
  {
    src: staticFile('demo-assets/pin-lock.png'),
    eyebrow: 'Step 1',
    title: 'Unlock the workspace',
    body: 'A static local PIN keeps the app fast and fully offline.',
    start: 90,
    duration: 135
  },
  {
    src: staticFile('demo-assets/workspace-overview.png'),
    eyebrow: 'Step 2',
    title: 'Scan the month as cards',
    body: 'Square day cards keep notes and tasks visible without turning the month into a spreadsheet.',
    start: 225,
    duration: 150
  },
  {
    src: staticFile('demo-assets/project-filter.png'),
    eyebrow: 'Step 3',
    title: 'Filter by project instantly',
    body: 'The left rail behaves like a real project workspace, not a stats sidebar.',
    start: 375,
    duration: 135
  },
  {
    src: staticFile('demo-assets/popup-editor.png'),
    eyebrow: 'Step 4',
    title: 'Edit inline or with a popup',
    body: 'Quick changes stay inline. Longer edits, moves, and retagging open a focused editor.',
    start: 510,
    duration: 150
  }
];

const cardStyle: React.CSSProperties = {
  background: palette.paper,
  border: `1px solid ${palette.line}`,
  borderRadius: 26,
  boxShadow: '0 24px 60px rgba(20,20,19,0.08)'
};

const textPanelStyle: React.CSSProperties = {
  ...cardStyle,
  width: 420,
  padding: '28px 30px'
};

export const DailyNotesDesktopDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introOpacity = interpolate(frame, [0, 20, 70, 88], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const introTranslate = interpolate(frame, [0, 30], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at top, rgba(199,195,186,0.24), transparent 36%), ${palette.page}`,
        color: palette.ink,
        fontFamily: '"Anthropic Sans", "Inter", sans-serif'
      }}
    >
      <AbsoluteFill
        style={{
          opacity: 0.9,
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.32), transparent 40%), linear-gradient(180deg, transparent, rgba(20,20,19,0.04))'
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          padding: '80px 96px'
        }}
      >
        <div
          style={{
            ...cardStyle,
            opacity: introOpacity,
            transform: `translateY(${introTranslate}px)`,
            padding: '40px 44px',
            width: 700
          }}
        >
          <div
            style={{
              color: palette.muted,
              fontSize: 13,
              letterSpacing: '0.18em',
              marginBottom: 16,
              textTransform: 'uppercase',
              fontWeight: 500
            }}
          >
            Daily Notes Desktop
          </div>
          <div
            style={{
              fontFamily: '"Anthropic Serif", "Iowan Old Style", serif',
              fontSize: 78,
              lineHeight: 0.94,
              fontWeight: 330,
              marginBottom: 18
            }}
          >
            Calm local planning for every day.
          </div>
          <div
            style={{
              color: palette.muted,
              fontSize: 24,
              lineHeight: 1.5,
              maxWidth: 560
            }}
          >
            A desktop workspace for daily notes, project-tagged tasks, and fast inline edits.
          </div>
        </div>
      </AbsoluteFill>

      {shots.map((shot) => (
        <Sequence key={shot.src} from={shot.start} durationInFrames={shot.duration}>
          <Shot
            body={shot.body}
            eyebrow={shot.eyebrow}
            src={shot.src}
            title={shot.title}
          />
        </Sequence>
      ))}

      <Sequence from={645} durationInFrames={45}>
        <AbsoluteFill
          style={{
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            padding: '0 96px 72px'
          }}
        >
          <div
            style={{
              ...textPanelStyle,
              width: 560,
              background: palette.paperMuted
            }}
          >
            <div
              style={{
                color: palette.muted,
                fontSize: 13,
                letterSpacing: '0.12em',
                marginBottom: 14,
                textTransform: 'uppercase',
                fontWeight: 500
              }}
            >
              Built with Electron, React, TypeScript, Tailwind, Zod, Playwright, and Remotion
            </div>
            <div
              style={{
                fontFamily: '"Anthropic Serif", "Iowan Old Style", serif',
                fontSize: 46,
                lineHeight: 1.06,
                fontWeight: 330
              }}
            >
              Daily Notes Desktop demo
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

const Shot: React.FC<{
  body: string;
  eyebrow: string;
  src: string;
  title: string;
}> = ({ body, eyebrow, src, title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({
    fps,
    frame,
    config: {
      damping: 18,
      stiffness: 110,
      mass: 0.8
    }
  });

  const opacity = interpolate(frame, [0, 10, 115, 135], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const screenScale = interpolate(frame, [0, 140], [1.06, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <AbsoluteFill
      style={{
        opacity,
        justifyContent: 'center',
        padding: '74px 72px'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 420px',
          gap: 28,
          alignItems: 'center'
        }}
      >
        <div
          style={{
            ...cardStyle,
            overflow: 'hidden',
            padding: 18,
            transform: `translateY(${interpolate(1 - reveal, [0, 1], [0, 30])}px) scale(${screenScale})`
          }}
        >
          <Img
            src={src}
            style={{
              width: '100%',
              height: 730,
              objectFit: 'cover',
              borderRadius: 18,
              border: `1px solid ${palette.line}`
            }}
          />
        </div>

        <div
          style={{
            ...textPanelStyle,
            transform: `translateY(${interpolate(1 - reveal, [0, 1], [0, 18])}px)`
          }}
        >
          <div
            style={{
              color: palette.muted,
              fontSize: 13,
              letterSpacing: '0.14em',
              marginBottom: 14,
              textTransform: 'uppercase',
              fontWeight: 500
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontFamily: '"Anthropic Serif", "Iowan Old Style", serif',
              fontSize: 50,
              lineHeight: 1.02,
              fontWeight: 330,
              marginBottom: 18
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: palette.muted,
              fontSize: 23,
              lineHeight: 1.5
            }}
          >
            {body}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
