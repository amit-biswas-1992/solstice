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
  line: 'rgba(31, 30, 29, 0.18)',
  accent: '#1f4e79'
};

const shots = [
  {
    src: staticFile('demo-assets/pin-lock.png'),
    eyebrow: 'Privacy First',
    title: 'Unlock your day',
    body: 'A simple PIN keeps your workspace private. No accounts, no cloud, no tracking.',
    start: 120,
    duration: 150
  },
  {
    src: staticFile('demo-assets/workspace-overview.png'),
    eyebrow: 'Calendar View',
    title: 'Your month at a glance',
    body: 'Every day is a card. See activity dots, task completion, and navigate naturally.',
    start: 270,
    duration: 165
  },
  {
    src: staticFile('demo-assets/project-filter.png'),
    eyebrow: 'Projects',
    title: 'Focus on what matters',
    body: 'Filter the entire workspace by project. The sidebar collapses when you don\'t need it.',
    start: 435,
    duration: 150
  },
  {
    src: staticFile('demo-assets/popup-editor.png'),
    eyebrow: 'Quick Editing',
    title: 'Edit inline or in a popup',
    body: 'Quick changes stay inline. Move, retag, or do longer edits in a focused popup.',
    start: 585,
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

const FeaturePill: React.FC<{ children: string }> = ({ children }) => (
  <span
    style={{
      background: palette.paperMuted,
      border: `1px solid ${palette.line}`,
      borderRadius: 999,
      color: palette.muted,
      display: 'inline-block',
      fontSize: 14,
      fontWeight: 500,
      letterSpacing: '0.02em',
      padding: '6px 16px'
    }}
  >
    {children}
  </span>
);

export const DailyNotesDesktopDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introOpacity = interpolate(frame, [0, 20, 90, 118], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const introTranslate = interpolate(frame, [0, 30], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const outroProgress = interpolate(frame, [735, 760], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 30% 20%, rgba(199,195,186,0.28), transparent 50%), ${palette.page}`,
        color: palette.ink,
        fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif'
      }}
    >
      <AbsoluteFill
        style={{
          opacity: 0.9,
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.32), transparent 40%), linear-gradient(180deg, transparent, rgba(20,20,19,0.04))'
        }}
      />

      {/* Intro */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          padding: '80px 96px',
          opacity: introOpacity,
          transform: `translateY(${introTranslate}px)`
        }}
      >
        <div
          style={{
            ...cardStyle,
            padding: '48px 52px',
            maxWidth: 780
          }}
        >
          <div
            style={{
              color: palette.muted,
              fontSize: 13,
              letterSpacing: '0.18em',
              marginBottom: 20,
              textTransform: 'uppercase',
              fontWeight: 600
            }}
          >
            Introducing
          </div>
          <div
            style={{
              fontSize: 88,
              lineHeight: 0.94,
              fontWeight: 300,
              marginBottom: 22,
              letterSpacing: '-0.02em'
            }}
          >
            Solstice
          </div>
          <div
            style={{
              color: palette.muted,
              fontSize: 26,
              lineHeight: 1.45,
              maxWidth: 580,
              marginBottom: 28
            }}
          >
            A calm, local-first daily planner.
            <br />
            Notes and tasks organized by day, not by folder.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <FeaturePill>Calendar</FeaturePill>
            <FeaturePill>Knowledge Graph</FeaturePill>
            <FeaturePill>Activity Heatmap</FeaturePill>
            <FeaturePill>Search</FeaturePill>
            <FeaturePill>Local-first</FeaturePill>
          </div>
        </div>
      </AbsoluteFill>

      {/* Feature shots */}
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

      {/* Outro */}
      <Sequence from={735} durationInFrames={75}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: outroProgress
          }}
        >
          <div
            style={{
              ...cardStyle,
              padding: '52px 64px',
              textAlign: 'center',
              maxWidth: 700
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 300,
                letterSpacing: '-0.02em',
                marginBottom: 16
              }}
            >
              Solstice
            </div>
            <div
              style={{
                color: palette.muted,
                fontSize: 22,
                lineHeight: 1.5,
                marginBottom: 28
              }}
            >
              Open source. Local-first. Built with Electron, React & TypeScript.
            </div>
            <div
              style={{
                background: palette.ink,
                borderRadius: 14,
                color: '#fff',
                display: 'inline-block',
                fontSize: 18,
                fontWeight: 500,
                padding: '14px 32px'
              }}
            >
              github.com/amit-biswas-1992/solstice
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

  const opacity = interpolate(frame, [0, 12, 125, 148], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const screenScale = interpolate(frame, [0, 140], [1.04, 1], {
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
              color: palette.accent,
              fontSize: 13,
              letterSpacing: '0.14em',
              marginBottom: 14,
              textTransform: 'uppercase',
              fontWeight: 600
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontSize: 46,
              lineHeight: 1.06,
              fontWeight: 300,
              letterSpacing: '-0.01em',
              marginBottom: 18
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: palette.muted,
              fontSize: 21,
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
