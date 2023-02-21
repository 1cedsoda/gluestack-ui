// @ts-nocheck
import React from 'react';
import { createStyled, AddCssTokenVariables } from '@dank-style/react';
import { Wrapper } from '../../components/Wrapper';
import { View, Text } from 'react-native';
const styledCssTokensVariables = createStyled([new AddCssTokenVariables({})]);

const StyledView = styledCssTokensVariables(
  View,
  {
    w: 200,
    h: 200,
    bg: '$blue500',
  },
  {
    descendantStyle: ['_text'],
  }
);

const StyledText = styledCssTokensVariables(
  Text,
  {},
  {
    ancestorStyle: ['_text'],
  }
);

export function CSSVariables() {
  return (
    <Wrapper>
      <StyledView>
        <StyledText
          style={{
            color: 'var(--dank-colors-orange300)',
            margin: 'var(--dank-space-4)',
          }}
        >
          Hello World
        </StyledText>
      </StyledView>
    </Wrapper>
  );
}

export default CSSVariables;
