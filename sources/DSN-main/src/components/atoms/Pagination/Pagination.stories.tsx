import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from './Pagination';
import { PageSelector } from './PageSelector';
import spec from './Pagination.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Pagination meta ─────────────────────────────────────────────────────────

const meta: Meta<typeof Pagination> = {
  title: 'Navigation/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'container' },
  argTypes: {
    page: { control: { type: 'number', min: 1 } },
    totalPages: { control: { type: 'number', min: 1 } },
    totalRecords: { control: { type: 'number', min: 0 } },
    pageSize: { control: { type: 'number', min: 1 } },
    rowsPerPage: { control: { type: 'number' } },
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: {
    page: 3,
    totalPages: 10,
  },
};

/**
 * The first page — Previous arrow is disabled.
 */
export const FirstPage: Story = {
  name: 'First page',
  args: {
    page: 1,
    totalPages: 10,
  },
};

/**
 * The last page — Next arrow is disabled.
 */
export const LastPage: Story = {
  name: 'Last page',
  args: {
    page: 10,
    totalPages: 10,
  },
};

/**
 * Single page — both prev and next are disabled.
 */
export const SinglePage: Story = {
  name: 'Single page',
  args: {
    page: 1,
    totalPages: 1,
  },
};

/**
 * Large dataset: ellipsis appears between the current range and the last page.
 */
export const LargeDataset: Story = {
  name: 'Large dataset (ellipsis)',
  args: {
    page: 4,
    totalPages: 99,
  },
};

/**
 * Current page near the end — ellipsis at the start.
 */
export const NearEnd: Story = {
  name: 'Near end',
  args: {
    page: 97,
    totalPages: 99,
  },
};

/**
 * Both ellipsis regions shown — current page is deep in the middle.
 */
export const BothEllipsis: Story = {
  name: 'Both ellipsis',
  args: {
    page: 50,
    totalPages: 99,
  },
};

/**
 * With record count summary: shows "X–Y of Z" alongside the controls.
 */
export const WithSummary: Story = {
  name: 'With summary',
  args: {
    page: 2,
    totalPages: 25,
    totalRecords: 1240,
    pageSize: 50,
  },
};

/**
 * Full bar: rows-per-page selector + record count + pagination controls.
 */
export const FullBar: Story = {
  name: 'Full bar',
  args: {
    page: 3,
    totalPages: 25,
    totalRecords: 1240,
    pageSize: 50,
    rowsPerPage: 50,
    rowsPerPageOptions: [10, 25, 50, 100],
  },
};

/**
 * Controlled — parent owns the page state.
 */
export const Controlled: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    const totalPages = 20;
    const pageSize = 50;
    const totalRecords = 982;

    return (
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalRecords={totalRecords}
        pageSize={pageSize}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[25, 50, 100]}
      />
    );
  },
};

// ─── PageSelector meta ───────────────────────────────────────────────────────

export const PageSelectorStates: Story = {
  name: 'Page selector states',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <PageSelector page={1} />
      <PageSelector page={2} selected />
      <PageSelector page={3} />
      <PageSelector page={4} disabled />
    </div>
  ),
};
