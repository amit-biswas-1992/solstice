import { Composition } from 'remotion';
import { DailyNotesDesktopDemo } from './DailyNotesDesktopDemo';

export const RemotionRoot = () => {
  return (
    <Composition
      id="DailyNotesDesktopDemo"
      component={DailyNotesDesktopDemo}
      width={1600}
      height={900}
      fps={30}
      durationInFrames={810}
    />
  );
};
