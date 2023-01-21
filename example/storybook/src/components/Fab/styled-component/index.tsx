import { styled } from '@dank-style/react';
import { Pressable } from 'react-native';

const Fab: any = styled(
  Pressable,
  {
    baseStyle: {
      style: {
        bg: '$primary500',
        rounded: '$full',
        zIndex: 20,
        px: 16,
        py: 16,
        flexDirection: 'row',
        alignItems: 'center',
      },
      state: {
        hover: {
          style: { bg: '$primary700' },
        },
        active: {
          style: { bg: '$primary900' },
        },
      },
    },
    variants: {
      'top-right': {
        style: { top: 12, right: 4, position: 'absolute' },
      },
      'top-left': {
        style: { top: 12, left: 4, position: 'absolute' },
      },
      'bottom-right': {
        style: { bottom: 4, right: 4, position: 'absolute' },
      },
      'bottom-left': {
        style: { bottom: 4, left: 4, position: 'absolute' },
      },
    },

    defaultProps: {
      variant: 'top-right',
    },
  },
  {}
);

export { Fab as Root };
export { default as Label } from './Label';
