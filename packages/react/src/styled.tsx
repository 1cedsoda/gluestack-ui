import React, {
  // Component,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  ConfigType,
  OrderedSXResolved,
  // Styled,
  StyleIds,
  // DefaultAndState,
  ComponentProps,
  UtilityProps,
  IdsStateColorMode,
  ITheme,
} from './types';

import {
  deepMerge,
  // deepMergeArray,
  getResolvedTokenValueFromConfig,
} from './utils';
import { convertUtilityPropsToSX } from '@dank-style/convert-utility-to-sx';
import { useStyled } from './StyledProvider';
import { propertyTokenMap } from './propertyTokenMap';
import { Platform } from 'react-native';
import { injectInStyle } from './injectInStyle';
import { updateCSSStyleInOrderedResolved } from './updateCSSStyleInOrderedResolved';
import { generateStylePropsFromCSSIds } from './generateStylePropsFromCSSIds';

import { set, get, onChange } from '@dank-style/color-mode';
import { useSxPropsStyleTagInjector } from './useSxPropsStyleTagInjector';
import {
  styledResolvedToOrderedSXResolved,
  styledToStyledResolved,
  getStyleIds,
  getComponentResolved,
  getDescendantResolved,
} from './resolver';
import { sxToVerboseSx } from './convertSxToSxVerbosed';
set('light');

function getStateStyleCSSFromStyleIds(
  styleIdObject: IdsStateColorMode,
  states: any,
  colorMode: any
) {
  const stateStyleCSSIds: Array<any> = [];

  if (states || colorMode) {
    function isSubset(subset: any, set: any) {
      return subset.every((item: any) => set.includes(item));
    }

    function flattenObject(obj: any) {
      const flat: any = {};

      // Recursive function to flatten the object
      function flatten(obj: any, path: any = []) {
        // Iterate over the object's keys
        for (const key of Object.keys(obj)) {
          // console.log(
          //   key,
          //   [...path, key],
          //   typeof obj[key],
          //   // flatten(obj[key], [...path, key]),
          //   'key here 111'
          // );
          // If the value is an object, recurse
          if (key === 'ids' && path.length > 0) {
            flat[`${path.join('.')}`] = obj[key];
          } else if (typeof obj[key] === 'object') {
            flatten(obj[key], [...path, key]);
          } else {
            // Otherwise, add the key-value pair to the flat object
            flat[`${path.join('.')}`] = obj[key];
          }
        }
      }

      flatten(obj);
      return flat;
    }

    const flatternStyleIdObject = flattenObject(styleIdObject);

    Object.keys(flatternStyleIdObject).forEach((styleId) => {
      const styleIdKeyArray = styleId.split('.');
      const filteredStyleIdKeyArray = styleIdKeyArray.filter(
        (item) => item !== 'colorMode' && item !== 'state'
      );
      const stateColorMode = {
        ...states,
        [colorMode]: true,
      };

      const currentStateArray = Object.keys(stateColorMode).filter(
        (key) => stateColorMode[key] === true
      );

      if (isSubset(filteredStyleIdKeyArray, currentStateArray)) {
        stateStyleCSSIds.push(...flatternStyleIdObject[styleId]);
      }
    });
  }

  return stateStyleCSSIds;
}

function getMergedDefaultCSSIds(
  componentStyleIds: StyleIds,
  variant: string,
  size: string
) {
  const defaultStyleCSSIds: Array<string> = [];

  if (
    componentStyleIds &&
    componentStyleIds?.baseStyle &&
    componentStyleIds?.baseStyle?.ids
  ) {
    defaultStyleCSSIds.push(...componentStyleIds?.baseStyle?.ids);
  }
  if (
    variant &&
    componentStyleIds?.variants &&
    componentStyleIds?.variants[variant] &&
    componentStyleIds?.variants[variant]?.ids
  ) {
    //@ts-ignore
    defaultStyleCSSIds.push(...componentStyleIds?.variants[variant]?.ids);
  }
  if (
    size &&
    componentStyleIds?.sizes &&
    componentStyleIds?.sizes[size] &&
    componentStyleIds?.sizes[size]?.ids
  ) {
    defaultStyleCSSIds.push(...componentStyleIds?.sizes[size]?.ids);
  }

  return defaultStyleCSSIds;
}

const getMergeDescendantsStyleCSSIdsWithKey = (
  descendantStyles: any,
  variant: any,
  size: any
) => {
  const descendantStyleObj: any = {};
  if (descendantStyles) {
    Object.keys(descendantStyles)?.forEach((key) => {
      const styleObj = descendantStyles[key];

      const defaultBaseCSSIds = getMergedDefaultCSSIds(styleObj, variant, size);
      descendantStyleObj[key] = defaultBaseCSSIds;
    });
  }

  return descendantStyleObj;
};

const Context = React.createContext({});

const globalStyleMap: Map<string, any> = new Map<string, any>();
//

// window['globalStyleMap'] = globalStyleMap;
// const globalOrderedList: any = [];
// setTimeout(() => {
//   const orderedList = globalOrderedList.sort(
//     (a: any, b: any) => a.meta.weight - b.meta.weight
//   );
//   injectInStyle(orderedList);
// });

function getMergedStateAndColorModeCSSIds(
  componentStyleIds: StyleIds,
  states: any,
  variant: string,
  size: string,
  COLOR_MODE: 'light' | 'dark'
) {
  const stateStyleCSSIds = [];

  // console.log(componentStyleIds, states, 'component style id');
  if (componentStyleIds.baseStyle) {
    stateStyleCSSIds.push(
      ...getStateStyleCSSFromStyleIds(
        componentStyleIds.baseStyle,
        states,
        COLOR_MODE
      )
    );
  }

  if (
    variant &&
    componentStyleIds.variants &&
    componentStyleIds.variants[variant]
  ) {
    stateStyleCSSIds.push(
      ...getStateStyleCSSFromStyleIds(
        componentStyleIds.variants[variant],
        states,
        COLOR_MODE
      )
    );
  }

  if (size && componentStyleIds.sizes && componentStyleIds.sizes[size]) {
    stateStyleCSSIds.push(
      ...getStateStyleCSSFromStyleIds(
        componentStyleIds.sizes[size],
        states,
        COLOR_MODE
      )
    );
  }

  return stateStyleCSSIds;
}

function getAncestorCSSStyleIds(compConfig: any, context: any) {
  let ancestorStyleIds: any[] = [];
  if (compConfig.ancestorStyle?.length > 0) {
    compConfig.ancestorStyle.forEach((ancestor: any) => {
      if (context[ancestor]) {
        ancestorStyleIds = context[ancestor];
      }
    });
  }

  return ancestorStyleIds;
}
function mergeArraysInObjects(...objects: any) {
  const merged: any = {};
  for (const object of objects) {
    for (const [key, value] of Object.entries(object)) {
      if (
        merged.hasOwnProperty(key) &&
        Array.isArray(merged[key]) &&
        Array.isArray(value)
      ) {
        merged[key] = merged[key].concat(value);
      } else {
        merged[key] = value;
      }
    }
  }
  return merged;
}

// let resolvedComponentMap = new Map<Component, any>();

// function isAlreadyResolved(Component) {

// }
function resolvePlatformTheme(theme: any, platform: any) {
  if (typeof theme === 'object') {
    Object.keys(theme).forEach((themeKey) => {
      if (themeKey !== 'style' && themeKey !== 'defaultProps') {
        if (theme[themeKey].platform) {
          let temp = { ...theme[themeKey] };
          theme[themeKey] = deepMerge(temp, theme[themeKey].platform[platform]);
          delete theme[themeKey].platform;
          resolvePlatformTheme(theme[themeKey], platform);
        } else if (themeKey === 'queries') {
          theme[themeKey].forEach((query: any) => {
            if (query.value.platform) {
              let temp = { ...query.value };
              query.value = deepMerge(temp, query.value.platform[platform]);
              delete query.value.platform;
            }
            resolvePlatformTheme(query.value, platform);
          });
        } else {
          resolvePlatformTheme(theme[themeKey], platform);
        }
      }
    });
  }
}

export function verboseStyled<P, Variants, Sizes>(
  Component: React.ComponentType<P>,
  theme: ITheme<Variants, Sizes, P>,
  componentStyleConfig: ConfigType,
  ExtendedConfig?: any,
  BUILD_TIME_PARAMS?: {
    orderedResolved: OrderedSXResolved;
    styleIds: {
      component: StyleIds;
      descendant: StyleIds;
    };
  }
) {
  //@ts-ignore
  type X = P['style'];
  let styleHashCreated = false;

  let orderedResolved: OrderedSXResolved;
  let componentStyleIds: any = {};
  let componentDescendantStyleIds: StyleIds; // StyleIds = {};
  let componentExtendedConfig: any = {};
  let styleIds = {} as {
    component: StyleIds;
    descendant: StyleIds;
  };

  if (BUILD_TIME_PARAMS?.orderedResolved) {
    orderedResolved = BUILD_TIME_PARAMS?.orderedResolved;
  }
  if (BUILD_TIME_PARAMS?.styleIds) {
    styleIds = BUILD_TIME_PARAMS?.styleIds;
  }
  resolvePlatformTheme(theme, Platform.OS);

  // const styledResolved = styledToStyledResolved(theme, [], CONFIG);
  // const orderedResovled = styledResolvedToOrderedSXResolved(styledResolved);

  // updateCSSStyleInOrderedResolved(orderedResovled);
  // //set css ruleset
  // globalOrderedList.push(...orderedResovled);

  // // StyleIds
  // const componentStyleIds = getComponentStyleIds(
  //   orderedResovled.filter((item) => !item.meta.path?.includes('descendants'))
  // );

  // if (componentStyleConfig.DEBUG === 'INPUT') {
  //   // console.log(componentStyleIds, 'hello state here >>');
  // }

  // // Descendants
  // const descendantStyleIds = getDescendantStyleIds(
  //   orderedResovled.filter((item) => item.meta.path?.includes('descendants')),
  //   componentStyleConfig.descendantStyle
  // );

  //

  function injectComponentAndDescendantStyles(
    orderedResolved: OrderedSXResolved,
    styleTagId?: string
  ) {
    const componentOrderResolved = getComponentResolved(orderedResolved);
    const descendantOrderResolved = getDescendantResolved(orderedResolved);

    injectInStyle(
      componentOrderResolved,
      styleTagId ? styleTagId : 'css-injected-boot-time',
      globalStyleMap
    );

    injectInStyle(
      descendantOrderResolved,
      styleTagId ? styleTagId : 'css-injected-boot-time-descendant',
      globalStyleMap
    );
  }

  const NewComp = (
    properties: P & ComponentProps<X, Variants, Sizes> & UtilityProps,
    ref: any
  ) => {
    const styledContext = useStyled();
    const CONFIG = { ...styledContext.config, propertyTokenMap };

    const [COLOR_MODE, setCOLOR_MODE] = useState(get() as 'light' | 'dark');
    onChange((colorMode: any) => {
      // if (Platform.OS !== 'web') {
      setCOLOR_MODE(colorMode);
      // }
    });

    if (!styleHashCreated) {
      componentExtendedConfig = CONFIG;
      if (ExtendedConfig) {
        componentExtendedConfig = deepMerge(CONFIG, ExtendedConfig);
      }

      if (!orderedResolved) {
        const styledResolved = styledToStyledResolved(
          theme,
          [],
          componentExtendedConfig
        );
        orderedResolved = styledResolvedToOrderedSXResolved(styledResolved);
        updateCSSStyleInOrderedResolved(orderedResolved);
      }
      if (Object.keys(styleIds).length === 0) {
        styleIds = getStyleIds(orderedResolved, componentStyleConfig);
      }
      componentStyleIds = styleIds.component;
      componentDescendantStyleIds = styleIds.descendant;

      /* Boot time */
      injectComponentAndDescendantStyles(orderedResolved);

      styleHashCreated = true;
      /* Boot time */
    }

    const mergedWithUtilitProps = {
      ...theme?.defaultProps,
      ...properties,
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, variant, size, states, colorMode, ...props }: any =
      mergedWithUtilitProps;

    // Inline prop based style resolution
    const resolvedInlineProps = {};
    if (
      componentStyleConfig.resolveProps &&
      Object.keys(componentExtendedConfig).length > 0
    ) {
      componentStyleConfig.resolveProps.forEach((toBeResovledProp) => {
        if (props[toBeResovledProp]) {
          //@ts-ignore
          resolvedInlineProps[toBeResovledProp] =
            getResolvedTokenValueFromConfig(
              componentExtendedConfig,
              props,
              toBeResovledProp,
              props[toBeResovledProp]
            );
          delete props[toBeResovledProp];
        }
      });
    }

    const { sxProps: sx, mergedProps } = convertUtilityPropsToSX(
      componentExtendedConfig,
      componentStyleConfig?.descendantStyle,
      props
    );

    // const sx = {};
    // const mergedProps = props;

    const contextValue = useContext(Context);
    const applyComponentStyleCSSIds = React.useMemo(() => {
      return getMergedDefaultCSSIds(
        //@ts-ignore
        componentStyleIds,
        variant,
        size
      );
    }, [variant, size]);

    // console.log(componentStyleIds, 'hello hee');
    const [applyComponentStateStyleIds, setApplyComponentStateStyleIds] =
      useState([]);

    const applyDescendantsStyleCSSIdsWithKey = React.useMemo(() => {
      return getMergeDescendantsStyleCSSIdsWithKey(
        componentDescendantStyleIds,
        variant,
        size
      );
    }, [variant, size]);

    const [
      applyDescendantStateStyleCSSIdsWithKey,
      setApplyDescendantStateStyleCSSIdsWithKey,
    ] = useState({});

    // ancestorCSSStyleId
    const applyAncestorStyleCSSIds = React.useMemo(() => {
      return getAncestorCSSStyleIds(componentStyleConfig, contextValue);
    }, [contextValue]);

    // const [applyComponentStyleIds, setApplyComponentStyleIds] = useState([]);

    const sxComponentStyleIds = useRef({});
    const sxDescendantStyleIds = useRef({});

    // const [applySxStyleCSSIds, setApplySxStyleCSSIds] = useState([]);
    const applySxStyleCSSIds = useRef([]);

    const applySxDescendantStyleCSSIdsWithKey = useRef({});

    const [applySxStateStyleCSSIds, setApplyStateSxStyleCSSIds] = useState([]);
    const [
      applySxDescendantStateStyleCSSIdsWithKey,
      setApplySxDescendantStateStyleCSSIdsWithKey,
    ] = useState({});

    // SX resolution
    const styleTagId = useRef(
      `style-tag-${Math.random().toString().slice(2, 17)}`
    );

    // FOR SX RESOLUTION
    useSxPropsStyleTagInjector(styleTagId, sx);

    if (Object.keys(sx).length > 0) {
      const inlineSxTheme = {
        baseStyle: sx,
      };
      resolvePlatformTheme(inlineSxTheme, Platform.OS);
      const sxStyledResolved = styledToStyledResolved(
        // @ts-ignore
        inlineSxTheme,
        [],
        componentExtendedConfig
      );

      const orderedSXResolved =
        styledResolvedToOrderedSXResolved(sxStyledResolved);

      updateCSSStyleInOrderedResolved(orderedSXResolved);

      injectComponentAndDescendantStyles(orderedSXResolved, styleTagId.current);

      const sxStyleIds = getStyleIds(orderedSXResolved, componentStyleConfig);
      sxComponentStyleIds.current = sxStyleIds.component;
      sxDescendantStyleIds.current = sxStyleIds.descendant;

      // SX component style
      //@ts-ignore
      applySxStyleCSSIds.current = getMergedDefaultCSSIds(
        //@ts-ignore
        sxComponentStyleIds.current,
        variant,
        size
      );
      // SX descendants

      //@ts-ignore
      applySxDescendantStyleCSSIdsWithKey.current =
        getMergeDescendantsStyleCSSIdsWithKey(
          sxDescendantStyleIds.current,
          variant,
          size
        );
    }

    // Style ids resolution
    useEffect(() => {
      // for component style
      if (size || variant || states || COLOR_MODE) {
        const mergedStateIds: any = getMergedStateAndColorModeCSSIds(
          //@ts-ignore
          componentStyleIds,
          states,
          variant,
          size,
          COLOR_MODE
        );

        // console.log(mergedStateIds, states, '*******>>>');
        setApplyComponentStateStyleIds(mergedStateIds);

        // for sx props
        const mergedSxStateIds: any = getMergedStateAndColorModeCSSIds(
          //@ts-ignore

          sxComponentStyleIds.current,
          states,
          variant,
          size,
          COLOR_MODE
        );
        setApplyStateSxStyleCSSIds(mergedSxStateIds);

        // for descendants
        const mergedDescendantsStyle: any = {};
        Object.keys(componentDescendantStyleIds).forEach((key) => {
          const mergedStyle = getMergedStateAndColorModeCSSIds(
            //@ts-ignore

            componentDescendantStyleIds[key],
            states,
            variant,
            size,
            COLOR_MODE
          );
          mergedDescendantsStyle[key] = mergedStyle;
        });
        setApplyDescendantStateStyleCSSIdsWithKey(mergedDescendantsStyle);

        // for sx descendants

        const mergedSxDescendantsStyle: any = {};
        Object.keys(sxDescendantStyleIds.current).forEach((key) => {
          // console.log(sxDescendantStyleIds.current, 'hhhhhh11');
          const mergedStyle = getMergedStateAndColorModeCSSIds(
            //@ts-ignore
            sxDescendantStyleIds.current[key],
            states,
            variant,
            size,
            COLOR_MODE
          );
          mergedSxDescendantsStyle[key] = mergedStyle;
        });
        setApplySxDescendantStateStyleCSSIdsWithKey(mergedSxDescendantsStyle);
      }
    }, [size, states, variant, COLOR_MODE]);

    const descendentCSSIds = React.useMemo(() => {
      if (
        applyDescendantsStyleCSSIdsWithKey ||
        applyDescendantStateStyleCSSIdsWithKey ||
        applySxDescendantStateStyleCSSIdsWithKey ||
        applySxDescendantStyleCSSIdsWithKey ||
        contextValue
      ) {
        return mergeArraysInObjects(
          applyDescendantsStyleCSSIdsWithKey,
          applyDescendantStateStyleCSSIdsWithKey,
          applySxDescendantStyleCSSIdsWithKey.current,
          applySxDescendantStateStyleCSSIdsWithKey,
          contextValue
        );
      } else {
        return {};
      }
    }, [
      applyDescendantsStyleCSSIdsWithKey,
      applyDescendantStateStyleCSSIdsWithKey,
      applySxDescendantStateStyleCSSIdsWithKey,
      applySxDescendantStyleCSSIdsWithKey,
      contextValue,
    ]);

    const styleCSSIds = [
      ...applyComponentStyleCSSIds,
      ...applyComponentStateStyleIds,
      ...applyAncestorStyleCSSIds,
      ...applySxStyleCSSIds.current,
      ...applySxStateStyleCSSIds,
    ];

    const resolvedStyleProps = generateStylePropsFromCSSIds(
      props,
      styleCSSIds,
      globalStyleMap,
      CONFIG
    );

    const component = (
      <Component
        {...mergedProps}
        {...resolvedInlineProps}
        {...resolvedStyleProps}
        ref={ref}
      >
        {children}
      </Component>
    );

    if (
      componentStyleConfig?.descendantStyle &&
      componentStyleConfig?.descendantStyle?.length > 0
    ) {
      return (
        <Context.Provider value={descendentCSSIds}>
          {component}
        </Context.Provider>
      );
    }
    return component;
  };

  const StyledComp = React.forwardRef(NewComp);
  StyledComp.displayName = Component?.displayName
    ? 'DankStyled' + Component?.displayName
    : 'DankStyledComponent';
  // @ts-ignore
  // StyledComp.config = componentStyleConfig;
  return StyledComp;
}

export function styled(
  Component: any,
  theme: any,
  componentStyleConfig: any,
  ExtendedConfig?: any,
  BUILD_TIME_PARAMS?: any
) {
  const sxConvertedObject = sxToVerboseSx(theme);

  const StyledComponent = verboseStyled(
    Component,
    sxConvertedObject,
    componentStyleConfig,
    ExtendedConfig,
    BUILD_TIME_PARAMS
  );

  return StyledComponent;
}
