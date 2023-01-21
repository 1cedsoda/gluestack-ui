import { styled } from '@dank-style/react';
import { View } from 'react-native';

export default styled(
  View,
  {
    baseStyle: {
      style: {
        w: 10,
        h: 10,
        bg: '$amber.700',
      },
    },
  },
  {}
);
