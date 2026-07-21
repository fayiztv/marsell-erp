import { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  DatePicker,
  Card,
  Avatar,
  Badge,
  PriorityBadge,
  StatusBadge,
  Modal,
  Dialog,
  ConfirmationDialog,
  SearchBar,
  EmptyState,
  CardSkeleton,
  StatCardSkeleton,
  LoadingSkeleton,
  Pagination,
} from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { Inbox, Plus, Layers, Palette } from 'lucide-react';

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.06]" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600">
          {title}
        </h2>
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-start gap-3">{children}</div>;
}

// ─── Showcase page ────────────────────────────────────────────────────────────

export function ComponentShowcase() {
  const toast = useToast();

  // Form state
  const [inputVal, setInputVal] = useState('');
  const [textareaVal, setTextareaVal] = useState('');
  const [selectVal, setSelectVal] = useState('');
  const [dateVal, setDateVal] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [page, setPage] = useState(1);

  // Dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const selectOptions = [
    { value: 'manager', label: 'Manager' },
    { value: 'employee', label: 'Employee' },
    { value: 'client', label: 'Client (Future)', disabled: true },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="size-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Layers size={16} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-100">
              Marsell — Component Showcase
            </h1>
            <p className="text-sm text-gray-500">
              Visual QA for the design system · Dark theme only
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="success" dot>
              18 Components
            </Badge>
            <Badge variant="info" dot>
              Zero TS Errors
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-10 space-y-12">

        {/* ── Buttons ── */}
        <Section title="Button — Variants">
          <Row>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="outline">Outline</Button>
          </Row>
          <Row>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </Row>
          <Row>
            <Button variant="primary" isLoading>Loading</Button>
            <Button variant="secondary" disabled>Disabled</Button>
            <Button variant="primary" leftIcon={<Plus size={14} />}>
              Create Ticket
            </Button>
          </Row>
        </Section>

        {/* ── Form Controls ── */}
        <Section title="Form Controls">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Employee Name"
              placeholder="Enter full name"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              helperText="As it appears on company records"
            />
            <Input
              label="Email Address"
              placeholder="email@company.com"
              error="This email is already in use"
            />
            <Select
              label="Role"
              options={selectOptions}
              value={selectVal}
              onChange={setSelectVal}
              placeholder="Select a role..."
              helperText="Determines portal access"
            />
            <DatePicker
              label="Due Date"
              value={dateVal}
              onChange={(e) => setDateVal(e.target.value)}
            />
          </div>
          <Textarea
            label="Description"
            placeholder="Describe the ticket in detail..."
            value={textareaVal}
            onChange={(e) => setTextareaVal(e.target.value)}
            maxLength={500}
            showCharCount
            rows={4}
          />
        </Section>

        {/* ── Search ── */}
        <Section title="SearchBar">
          <SearchBar
            value={searchVal}
            onChange={setSearchVal}
            placeholder="Search tickets..."
            className="max-w-sm"
          />
          <SearchBar
            value={searchVal}
            onChange={setSearchVal}
            placeholder="Loading state..."
            isLoading
            className="max-w-sm"
          />
        </Section>

        {/* ── Badges ── */}
        <Section title="Badges">
          <Row>
            <Badge>Default</Badge>
            <Badge variant="info" dot>Info</Badge>
            <Badge variant="success" dot>Success</Badge>
            <Badge variant="warning" dot>Warning</Badge>
            <Badge variant="danger" dot>Danger</Badge>
            <Badge variant="muted">Muted</Badge>
            <Badge variant="purple" dot>Purple</Badge>
          </Row>
          <Row>
            <span className="text-xs text-gray-500 w-full">Priority badges:</span>
            <PriorityBadge priority="low" />
            <PriorityBadge priority="medium" />
            <PriorityBadge priority="high" />
            <PriorityBadge priority="urgent" />
          </Row>
          <Row>
            <span className="text-xs text-gray-500 w-full">Status badges:</span>
            <StatusBadge status="pending" />
            <StatusBadge status="in_progress" />
            <StatusBadge status="on_hold" />
            <StatusBadge status="completed" />
          </Row>
        </Section>

        {/* ── Avatar ── */}
        <Section title="Avatar">
          <Row>
            {['xs', 'sm', 'md', 'lg', 'xl'].map((size) => (
              <Avatar
                key={size}
                name="Fayiz Ahmed"
                size={size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'}
              />
            ))}
          </Row>
          <Row>
            <Avatar name="Alice Johnson" size="md" />
            <Avatar name="Bob Smith" size="md" />
            <Avatar name="Carol White" size="md" />
            <Avatar name="David Brown" size="md" />
            <Avatar name="Eve Davis" size="md" />
            <Avatar name="Frank Miller" size="md" />
          </Row>
        </Section>

        {/* ── Cards ── */}
        <Section title="Card">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card padding="md">
              <p className="text-sm font-medium text-gray-200">Default Card</p>
              <p className="text-xs text-gray-500 mt-1">No hover effect</p>
            </Card>
            <Card padding="md" hoverable>
              <p className="text-sm font-medium text-gray-200">Hoverable Card</p>
              <p className="text-xs text-gray-500 mt-1">Border lifts on hover</p>
            </Card>
            <Card padding="md" hoverable glowOnHover>
              <p className="text-sm font-medium text-gray-200">Glow Card</p>
              <p className="text-xs text-gray-500 mt-1">Blue glow on hover</p>
            </Card>
          </div>
        </Section>

        {/* ── Toasts ── */}
        <Section title="Toast Notifications">
          <Row>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.success('Employee created', 'The account is now active.')}
            >
              Success Toast
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.error('Something went wrong', 'Please try again later.')}
            >
              Error Toast
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.warning('Heads up', 'This action cannot be undone.')}
            >
              Warning Toast
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.info('Syncing data...', 'Changes will appear shortly.')}
            >
              Info Toast
            </Button>
          </Row>
        </Section>

        {/* ── Modals / Dialogs ── */}
        <Section title="Modal · Dialog · ConfirmationDialog">
          <Row>
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
              Open Modal (primitive)
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsDialogOpen(true)}>
              Open Dialog (with header)
            </Button>
            <Button variant="danger" size="sm" onClick={() => setIsConfirmOpen(true)}>
              Delete Confirmation
            </Button>
          </Row>

          {/* Raw Modal */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="sm">
            <div className="p-6 text-center space-y-3">
              <div className="size-12 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center mx-auto">
                <Palette size={20} className="text-blue-400" />
              </div>
              <p className="text-base font-semibold text-gray-100">Modal Primitive</p>
              <p className="text-sm text-gray-400">
                This is the raw Modal — no built-in header or footer. Compose it freely.
              </p>
              <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            </div>
          </Modal>

          {/* Dialog with header + footer */}
          <Dialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            title="Edit Employee"
            description="Update the employee details below."
            size="md"
            actions={[
              { label: 'Cancel', onClick: () => setIsDialogOpen(false), variant: 'ghost' },
              { label: 'Save Changes', onClick: () => { toast.success('Saved!'); setIsDialogOpen(false); }, variant: 'primary' },
            ]}
          >
            <div className="space-y-4">
              <Input label="Full Name" placeholder="Enter name" />
              <Input label="Email" placeholder="email@company.com" />
            </div>
          </Dialog>

          {/* Confirmation dialog */}
          <ConfirmationDialog
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={() => {
              toast.success('Deleted', 'The record has been removed.');
              setIsConfirmOpen(false);
            }}
            title="Delete Employee"
            description="This will permanently remove the employee and all their associated data. This action cannot be undone."
            confirmLabel="Yes, Delete"
            variant="danger"
          />
        </Section>

        {/* ── Skeletons ── */}
        <Section title="Loading Skeletons">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {[1, 2, 3].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <LoadingSkeleton className="h-4 rounded-full" style={{ width: '40%' }} />
            <LoadingSkeleton className="h-4 rounded-full" style={{ width: '25%' }} />
          </div>
        </Section>

        {/* ── Empty State ── */}
        <Section title="Empty State">
          <Card padding="none" hoverable={false}>
            <EmptyState
              icon={<Inbox size={24} />}
              title="No tickets found"
              description="No tickets match your current filters. Try adjusting the search or clearing your filters."
              action={
                <Button variant="primary" size="sm" leftIcon={<Plus size={14} />}>
                  Create Ticket
                </Button>
              }
            />
          </Card>
        </Section>

        {/* ── Pagination ── */}
        <Section title="Pagination">
          <Card padding="md">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center px-4"
                  >
                    <span className="text-sm text-gray-500">Ticket #{i}</span>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={page}
                hasMore={page < 5}
                onPrevious={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => p + 1)}
                pageSize={10}
                itemCount={3}
              />
            </div>
          </Card>
        </Section>

        {/* Footer spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
