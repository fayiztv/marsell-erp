import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Layers,
  User,
  UserCheck,
  History,
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '@/components/ui';
import { formatDate } from '@/utils/dateUtils';
import { TicketHistorySection } from './TicketHistorySection';
import { CommentSection } from './CommentSection';
import type { Ticket } from '../types/ticket.types';

export interface TicketDetailLayoutProps {
  ticket: Ticket;
  deptLabel?: string | undefined;
  clientDetailUrl?: string | undefined;
  historyUrl: string;
  backUrl: string;
  headerActions?: React.ReactNode | undefined;
  statusControl?: React.ReactNode | undefined;
  priorityControl?: React.ReactNode | undefined;
  canComment?: boolean | undefined;
}

export function TicketDetailLayout({
  ticket,
  deptLabel,
  clientDetailUrl,
  historyUrl,
  backUrl,
  headerActions,
  statusControl,
  priorityControl,
  canComment = true,
}: TicketDetailLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ─── Back link ─── */}
      <button
        onClick={() => navigate(backUrl)}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Tickets
      </button>

      {/* ─── Top Header ─── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-900/40 p-6 rounded-xl border border-white/[0.06]">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-white/[0.08] font-semibold">
              #{ticket.id}
            </span>
            <StatusBadge status={ticket.status} />
            {deptLabel && (
              <span className="text-xs px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                {deptLabel}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight leading-tight">
            {ticket.title}
          </h1>
          <p className="text-sm text-gray-400">
            Created by <span className="text-gray-200 font-medium">{ticket.assignedByName}</span> · Assigned to{' '}
            <span className="text-gray-200 font-medium">{ticket.assignedToName}</span>
          </p>
        </div>

        {/* Right side of header: Created date & Action buttons */}
        <div className="flex flex-wrap items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-left sm:text-right">
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Created on</p>
            <p className="text-xs text-gray-300 font-medium">{formatDate(ticket.createdAt)}</p>
          </div>
          {headerActions && (
            <div className="flex items-center gap-2.5">
              {headerActions}
            </div>
          )}
        </div>
      </div>

      {/* ─── Two-Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Main Content (~67% width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Description Card */}
          <div className="p-6 rounded-xl border border-white/[0.06] bg-gray-900/50 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Description
            </h3>
            <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
              {ticket.description || 'No description provided.'}
            </p>
          </div>

          {/* 2. Client Card (only if ticket has a client) */}
          {ticket.clientId && (
            <div className="p-5 rounded-xl border border-white/[0.06] bg-gray-900/50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Building2 size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Client</p>
                  <h4 className="text-sm font-semibold text-gray-100 truncate">
                    {ticket.clientName || 'Unnamed Client'}
                  </h4>
                </div>
              </div>

              {clientDetailUrl && (
                <Link
                  to={clientDetailUrl}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline shrink-0"
                >
                  View Client
                  <ExternalLink size={13} />
                </Link>
              )}
            </div>
          )}

          {/* 3. History Card (Recent 5 with View All History link) */}
          <TicketHistorySection
            ticketId={ticket.id}
            viewAllUrl={historyUrl}
            maxEntries={5}
          />
        </div>

        {/* RIGHT COLUMN: Sidebar (~33% width, sticky) */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="p-5 rounded-xl border border-white/[0.06] bg-gray-900/50 space-y-4">
            {/* Status */}
            <div>
              <p className="text-[11px] text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">
                Status
              </p>
              {statusControl || <StatusBadge status={ticket.status} />}
            </div>

            {/* Priority */}
            <div>
              <p className="text-[11px] text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">
                Priority
              </p>
              {priorityControl || <PriorityBadge priority={ticket.priority} />}
            </div>

            <div className="border-t border-white/[0.06] pt-3 space-y-3.5">
              {/* Client Info Row */}
              <div className="flex items-start justify-between gap-3 text-xs">
                <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                  <Building2 size={14} className="text-gray-400" />
                  Client
                </span>
                <span className="text-gray-200 font-medium text-right truncate">
                  {ticket.clientName || 'Internal / No Client'}
                </span>
              </div>

              {/* Assigned To Info Row */}
              <div className="flex items-start justify-between gap-3 text-xs">
                <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                  <User size={14} className="text-gray-400" />
                  Assigned To
                </span>
                <span className="text-gray-200 font-medium text-right truncate">
                  {ticket.assignedToName}
                </span>
              </div>

              {/* Created By Info Row */}
              <div className="flex items-start justify-between gap-3 text-xs">
                <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                  <UserCheck size={14} className="text-gray-400" />
                  Created By
                </span>
                <span className="text-gray-200 font-medium text-right truncate">
                  {ticket.assignedByName}
                </span>
              </div>

              {/* Department Row */}
              {deptLabel && (
                <div className="flex items-start justify-between gap-3 text-xs">
                  <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                    <Layers size={14} className="text-blue-400" />
                    Department
                  </span>
                  <span className="text-gray-200 font-medium text-right truncate">
                    {deptLabel}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.06] pt-3 space-y-3.5">
              {/* Due Date Info Row */}
              <div className="flex items-start justify-between gap-3 text-xs">
                <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                  <Calendar size={14} className="text-gray-400" />
                  Due Date
                </span>
                <span className="text-gray-200 font-medium text-right">
                  {ticket.dueDate ? formatDate(ticket.dueDate) : 'No due date'}
                </span>
              </div>

              {/* Created Date Info Row */}
              <div className="flex items-start justify-between gap-3 text-xs">
                <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                  <Clock size={14} className="text-gray-400" />
                  Created Date
                </span>
                <span className="text-gray-300 text-right">
                  {formatDate(ticket.createdAt)}
                </span>
              </div>

              {/* Last Updated Info Row */}
              <div className="flex items-start justify-between gap-3 text-xs">
                <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                  <History size={14} className="text-gray-400" />
                  Last Updated
                </span>
                <span className="text-gray-300 text-right">
                  {ticket.updatedAt ? formatDate(ticket.updatedAt) : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Full-Width Comments Section ─── */}
      <div className="pt-2">
        <CommentSection ticketId={ticket.id} canComment={canComment} />
      </div>
    </div>
  );
}
