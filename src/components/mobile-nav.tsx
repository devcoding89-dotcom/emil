'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Mailbox,
  Send,
  Settings,
} from 'lucide-react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/extract', label: 'Extract Emails', icon: Mailbox },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/campaigns', label: 'Campaigns', icon: Send },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="grid gap-6 text-lg font-medium">
      <Link
        href="/"
        className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
      >
        <Icons.logo className="h-5 w-5 transition-all group-hover:scale-110" />
        <span className="sr-only">EmailCraft Studio</span>
      </Link>
      {navLinks.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
            {
              'text-foreground':
                (href === '/' && pathname === '/') ||
                (href !== '/' && pathname.startsWith(href)),
            }
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
      <Link
        href="/settings"
        className={cn(
          'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
          {
            'text-foreground': pathname.startsWith('/settings'),
          }
        )}
      >
        <Settings className="h-5 w-5" />
        Settings
      </Link>
    </nav>
  );
}
