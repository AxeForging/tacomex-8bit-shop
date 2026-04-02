import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Mail, Smartphone, ArrowLeft, CheckCheck, RefreshCw } from 'lucide-react';
import { PixelButton, LoadingSpinner } from '@/components';
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/hooks';
import { Notification } from '@/types';
import './Messages.css';

type Tab = 'email' | 'sms';

const Messages: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get('tab') as Tab) || 'email'
  );
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const queryClient = useQueryClient();

  const { data: emailData, isLoading: emailLoading } = useNotifications('email');
  const { data: smsData, isLoading: smsLoading } = useNotifications('sms');
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllRead();

  // Auto-select notification from URL params (e.g. /messages?tab=email&id=3)
  useEffect(() => {
    const targetId = searchParams.get('id');
    if (!targetId || selectedNotification) return;

    const allNotifs = [...(emailData?.notifications || []), ...(smsData?.notifications || [])];
    const found = allNotifs.find((n) => n.id === parseInt(targetId));
    if (found) {
      setActiveTab(found.channel);
      handleSelectNotification(found);
      // Clear the params so refreshing doesn't re-select
      setSearchParams({}, { replace: true });
    }
  }, [emailData, smsData, searchParams]);

  const emails = emailData?.notifications || [];
  const smsList = smsData?.notifications || [];
  const isLoading = emailLoading || smsLoading;

  const handleSelectNotification = (notif: Notification) => {
    setSelectedNotification(notif);
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const unreadEmails = emails.filter((e) => !e.isRead).length;
  const unreadSms = smsList.filter((s) => !s.isRead).length;

  if (isLoading) {
    return (
      <div className="messages__loading">
        <LoadingSpinner size="lg" text="Loading messages..." />
      </div>
    );
  }

  return (
    <div className="messages">
      <div className="messages__header">
        <h1 className="messages__title">Message Center</h1>
        <div className="messages__actions">
          <PixelButton
            variant="ghost"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['notifications'] })}
          >
            <RefreshCw size={14} /> Refresh
          </PixelButton>
          <PixelButton
            variant="ghost"
            onClick={() => markAllReadMutation.mutate()}
          >
            <CheckCheck size={14} /> Mark All Read
          </PixelButton>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="messages__tabs">
        <button
          className={`messages__tab ${activeTab === 'email' ? 'messages__tab--active' : ''}`}
          onClick={() => { setActiveTab('email'); setSelectedNotification(null); }}
        >
          <Mail size={16} />
          Email
          {unreadEmails > 0 && <span className="messages__tab-badge">{unreadEmails}</span>}
        </button>
        <button
          className={`messages__tab ${activeTab === 'sms' ? 'messages__tab--active' : ''}`}
          onClick={() => { setActiveTab('sms'); setSelectedNotification(null); }}
        >
          <Smartphone size={16} />
          SMS
          {unreadSms > 0 && <span className="messages__tab-badge">{unreadSms}</span>}
        </button>
      </div>

      {/* Content */}
      <div className="messages__content">
        {activeTab === 'email' ? (
          <EmailView
            emails={emails}
            selected={selectedNotification}
            onSelect={handleSelectNotification}
            onBack={() => setSelectedNotification(null)}
            formatDate={formatDate}
          />
        ) : (
          <SmsView
            messages={smsList}
            selected={selectedNotification}
            onSelect={handleSelectNotification}
            onBack={() => setSelectedNotification(null)}
            formatDate={formatDate}
            formatTime={formatTime}
          />
        )}
      </div>
    </div>
  );
};

// ========================================
// Email Inbox View
// ========================================

interface EmailViewProps {
  emails: Notification[];
  selected: Notification | null;
  onSelect: (n: Notification) => void;
  onBack: () => void;
  formatDate: (d: string) => string;
}

const EmailView: React.FC<EmailViewProps> = ({ emails, selected, onSelect, onBack, formatDate }) => {
  if (selected) {
    return (
      <div className="email-detail">
        <button className="email-detail__back" onClick={onBack}>
          <ArrowLeft size={14} /> Back to Inbox
        </button>
        <div className="email-detail__card">
          <div className="email-detail__header">
            <div className="email-detail__from">
              <div className="email-detail__avatar">T</div>
              <div>
                <span className="email-detail__sender">TacoMex 8-BIT</span>
                <span className="email-detail__address">&lt;{selected.fromAddress}&gt;</span>
              </div>
            </div>
            <span className="email-detail__date">{formatDate(selected.createdAt)}</span>
          </div>
          {selected.subject && (
            <div className="email-detail__subject-bar">
              <h2 className="email-detail__subject">{selected.subject}</h2>
            </div>
          )}
          <div className="email-detail__to">
            To: {selected.toAddress}
          </div>
          <div className="email-detail__body">
            {selected.body.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line === '' ? <br /> : <p>{line}</p>}
              </React.Fragment>
            ))}
          </div>
          <div className="email-detail__footer">
            <span className="email-detail__pixel-stamp">Sent via TacoMex 8-BIT Postal Service</span>
          </div>
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="messages__empty">
        <span className="messages__empty-icon">📧</span>
        <p className="messages__empty-text">No emails yet</p>
        <p className="messages__empty-hint">Place an order to receive email notifications!</p>
      </div>
    );
  }

  return (
    <div className="email-inbox">
      <div className="email-inbox__header">
        <span className="email-inbox__label">Inbox ({emails.length})</span>
      </div>
      <div className="email-inbox__list">
        {emails.map((email) => (
          <button
            key={email.id}
            className={`email-inbox__item ${!email.isRead ? 'email-inbox__item--unread' : ''}`}
            onClick={() => onSelect(email)}
          >
            <div className="email-inbox__item-dot">
              {!email.isRead && <span className="email-inbox__unread-dot" />}
            </div>
            <div className="email-inbox__item-avatar">T</div>
            <div className="email-inbox__item-content">
              <div className="email-inbox__item-top">
                <span className="email-inbox__item-sender">TacoMex 8-BIT</span>
                <span className="email-inbox__item-date">{formatDate(email.createdAt)}</span>
              </div>
              <span className="email-inbox__item-subject">{email.subject || '(No subject)'}</span>
              <span className="email-inbox__item-preview">
                {email.body.substring(0, 80)}...
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ========================================
// SMS Phone View
// ========================================

interface SmsViewProps {
  messages: Notification[];
  selected: Notification | null;
  onSelect: (n: Notification) => void;
  onBack: () => void;
  formatDate: (d: string) => string;
  formatTime: (d: string) => string;
}

const SmsView: React.FC<SmsViewProps> = ({ messages, selected, onSelect, onBack, formatDate, formatTime }) => {
  if (messages.length === 0) {
    return (
      <div className="messages__empty">
        <span className="messages__empty-icon">📱</span>
        <p className="messages__empty-text">No SMS messages yet</p>
        <p className="messages__empty-hint">Register a new account or place an order to receive SMS notifications!</p>
      </div>
    );
  }

  return (
    <div className="sms-phone">
      {/* Phone frame */}
      <div className="sms-phone__frame">
        {/* Phone notch */}
        <div className="sms-phone__notch">
          <div className="sms-phone__camera" />
        </div>

        {/* Phone screen */}
        <div className="sms-phone__screen">
          {/* Status bar */}
          <div className="sms-phone__status-bar">
            <span>TacoMex</span>
            <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
            <span>100%</span>
          </div>

          {selected ? (
            <>
              {/* Message detail header */}
              <div className="sms-phone__chat-header">
                <button className="sms-phone__back-btn" onClick={onBack}>
                  <ArrowLeft size={14} />
                </button>
                <div className="sms-phone__contact-avatar">T</div>
                <div className="sms-phone__contact-info">
                  <span className="sms-phone__contact-name">TacoMex 8-BIT</span>
                  <span className="sms-phone__contact-number">{selected.fromAddress}</span>
                </div>
              </div>

              {/* Chat bubble */}
              <div className="sms-phone__chat-area">
                <div className="sms-phone__date-divider">
                  {formatDate(selected.createdAt)}
                </div>
                <div className="sms-phone__bubble sms-phone__bubble--received">
                  <p>{selected.body}</p>
                  <span className="sms-phone__bubble-time">{formatTime(selected.createdAt)}</span>
                </div>
              </div>

              {/* Input area */}
              <div className="sms-phone__input-area">
                <div className="sms-phone__input-field">Message...</div>
                <button className="sms-phone__send-btn">Send</button>
              </div>
            </>
          ) : (
            <>
              {/* Messages list */}
              <div className="sms-phone__list-header">
                <span>Messages</span>
              </div>
              <div className="sms-phone__message-list">
                {messages.map((msg) => (
                  <button
                    key={msg.id}
                    className={`sms-phone__message-item ${!msg.isRead ? 'sms-phone__message-item--unread' : ''}`}
                    onClick={() => onSelect(msg)}
                  >
                    <div className="sms-phone__msg-avatar">T</div>
                    <div className="sms-phone__msg-content">
                      <div className="sms-phone__msg-top">
                        <span className="sms-phone__msg-sender">TacoMex 8-BIT</span>
                        <span className="sms-phone__msg-date">{formatDate(msg.createdAt)}</span>
                      </div>
                      <span className="sms-phone__msg-preview">
                        {msg.body.substring(0, 60)}...
                      </span>
                    </div>
                    {!msg.isRead && <span className="sms-phone__msg-unread-dot" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Home button */}
        <div className="sms-phone__home-bar" />
      </div>
    </div>
  );
};

export default Messages;
