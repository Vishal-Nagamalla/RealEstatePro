'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { Button, NavDropdown } from 'react-bootstrap';
import { PersonCircle } from 'react-bootstrap-icons';

export default function AuthButton() {
  const { data: session, status } = useSession();

  // Desktop detection
  const [isDesktop, setIsDesktop] = useState(false);

  // Account dropdown hover control
  const [show, setShow] = useState(false);
  const closeTimer = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 992px)');
    const handler = () => setIsDesktop(mq.matches);
    handler();
    mq.addEventListener?.('change', handler);

    return () => {
      mq.removeEventListener?.('change', handler);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const open = () => {
    if (!isDesktop) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShow(true);
  };

  const closeSoon = () => {
    if (!isDesktop) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setShow(false), 150);
  };

  // Loading state
  if (status === 'loading') {
    return (
      <Button
        variant="outline-warning"
        size="sm"
        className="auth-btn magnetic"
        disabled
        aria-label="Loading account"
      >
        <PersonCircle size={18} />
      </Button>
    );
  }

  // Logged out
  if (!session) {
    return (
      <Button
        variant="outline-warning"
        size="sm"
        className="auth-btn magnetic"
        onClick={() => signIn('google')}
        aria-label="Login"
        title="Login"
      >
        <PersonCircle size={18} />
      </Button>
    );
  }

  const fullName = session?.user?.name || 'Account';
  const email = session?.user?.email || '';
  const image = session?.user?.image || '';

  const Title = (
    <span className="auth-avatar" title={fullName} aria-label={fullName}>
      {image ? (
        <img src={image} alt={fullName} className="auth-avatar-img" />
      ) : (
        <PersonCircle size={18} />
      )}
    </span>
  );

  return (
    <NavDropdown
      title={Title}
      id="nav-account"
      align="end"
      menuVariant="dark"
      className="auth-dropdown"
      show={show}
      onMouseEnter={open}
      onMouseLeave={closeSoon}
      onToggle={(nextShow) => {
        // Mobile: normal click toggle
        if (!isDesktop) {
          setShow(nextShow);
          return;
        }
        // Desktop: allow closing (outside click / ESC) to work
        if (!nextShow) setShow(false);
      }}
    >
      <div className="px-3 py-2">
        <div className="auth-menu-name">{fullName}</div>
        {email ? <div className="auth-menu-email">{email}</div> : null}
      </div>

      <NavDropdown.Divider />

      <NavDropdown.Item onClick={() => signOut()}>
        Sign out
      </NavDropdown.Item>
    </NavDropdown>
  );
}