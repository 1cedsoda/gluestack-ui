import type { ComponentMeta } from '@storybook/react-native';
import Box from './Box';
import BoxWithRef from './BoxWithRef';

const BoxMeta: ComponentMeta<typeof Box> = {
  title: 'stories/Box',
  component: Box,

  args: { bg: 'primary500', w: 100, h: 100 },
};

export default BoxMeta;

export { Box, BoxWithRef };
