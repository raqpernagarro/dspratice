import { addons } from 'storybook/manager-api';
import { dsTheme } from './theme';

addons.setConfig({
  theme: dsTheme,
  showPanel: true,
  panelPosition: 'right',
  selectedPanel: 'storybook/controls/panel',
});
