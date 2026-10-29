import type { Meta, StoryObj } from '@storybook/react-vite';
import AiChat from '../../templates/ai-chat.jsx';
import Dashboard from '../../templates/dashboard.jsx';
import DataPage from '../../templates/data-page.jsx';
import DetailDrawer from '../../templates/detail-drawer.jsx';
import FormPage from '../../templates/form-page.jsx';
import KanbanBoard from '../../templates/kanban-board.jsx';
import Login from '../../templates/login.jsx';
import Settings from '../../templates/settings.jsx';

/**
 * Page templates from `templates/` — the same files the docs site renders on
 * /templates and opens in the prototype playground. Stories exist so Chromatic
 * catches visual regressions in full-page compositions.
 */
const meta = {
  title: 'Templates',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const DashboardPage: Story = { name: 'Dashboard', render: () => <Dashboard /> };
export const DataPageTemplate: Story = { name: 'Data page', render: () => <DataPage /> };
export const KanbanBoardTemplate: Story = { name: 'Kanban board', render: () => <KanbanBoard /> };
export const DetailDrawerTemplate: Story = { name: 'Detail drawer', render: () => <DetailDrawer /> };
export const FormPageTemplate: Story = { name: 'Form page', render: () => <FormPage /> };
export const SettingsTemplate: Story = { name: 'Settings', render: () => <Settings /> };
export const SignIn: Story = { name: 'Sign in', render: () => <Login /> };
export const AiChatTemplate: Story = { name: 'AI chat', render: () => <AiChat /> };
