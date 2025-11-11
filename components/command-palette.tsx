'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { 
  Search, 
  MessageSquare, 
  Plus, 
  Settings, 
  FileText,
  History,
  Sparkles,
  Calculator,
  Globe,
  Clock,
  Brain,
  Trash2,
  List,
  Mail,
  Calendar
} from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import type { Chat } from '@/lib/db/schema';

interface CommandPaletteProps {
  user?: { id: string } | null;
}

export function CommandPalette({ user }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [search, setSearch] = useState('');

  // Fetch chat history for search
  const searchQuery = search.length > 0 ? `&search=${encodeURIComponent(search)}` : '';
  const { data: chatHistory } = useSWR<{ chats: Chat[]; hasMore: boolean }>(
    user ? `/api/history?limit=50${searchQuery}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Toggle command palette with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Close on Escape
      if (e.key === 'Escape' && open) {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open]);

  // Use server-filtered chats or client-side filter as fallback
  const filteredChats = chatHistory?.chats || [];

  const handleSelectChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
    setOpen(false);
    setSearch('');
  };

  const handleNewChat = () => {
    router.push('/chat');
    setOpen(false);
    setSearch('');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'calculator':
        router.push('/chat?query=Calculate:');
        break;
      case 'time':
        router.push('/chat?query=What time is it?');
        break;
      case 'web':
        router.push('/chat?query=Search the web for:');
        break;
      case 'memories':
        router.push('/chat?query=listMemories');
        break;
      case 'remember':
        router.push('/chat?query=Remember:');
        break;
      default:
        break;
    }
    setOpen(false);
    setSearch('');
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="w-full max-w-2xl overflow-hidden rounded-lg border border-purple-500/50 bg-[#0a0a0f] shadow-2xl shadow-purple-500/20 dark:bg-[#0a0a0f]">
        <div className="flex items-center px-4 py-2">
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-purple-500/50 bg-purple-500/10 px-2 font-mono text-[10px] font-medium text-purple-400 sm:flex ml-auto">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
        <CommandInput
          placeholder="Search chats, actions, or commands..."
          value={search}
          onValueChange={setSearch}
          className="border-purple-500/30 text-white placeholder:text-zinc-500"
        />
        <CommandList className="max-h-[400px] overflow-y-auto p-2">
          <CommandEmpty className="py-6 text-center text-sm text-zinc-400">
            No results found.
          </CommandEmpty>

          {/* Quick Actions */}
          {search.length === 0 && (
            <>
              <CommandGroup heading="Quick Actions">
                <CommandItem
                  onSelect={handleNewChat}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-purple-500/20 hover:text-purple-300 cursor-pointer data-[selected]:bg-purple-500/30 data-[selected]:text-purple-300"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Chat</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleQuickAction('calculator')}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-purple-500/20 hover:text-purple-300 cursor-pointer data-[selected]:bg-purple-500/30 data-[selected]:text-purple-300"
                >
                  <Calculator className="h-4 w-4" />
                  <span>Calculator</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleQuickAction('time')}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-purple-500/20 hover:text-purple-300 cursor-pointer data-[selected]:bg-purple-500/30 data-[selected]:text-purple-300"
                >
                  <Clock className="h-4 w-4" />
                  <span>Current Time</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleQuickAction('web')}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-purple-500/20 hover:text-purple-300 cursor-pointer data-[selected]:bg-purple-500/30 data-[selected]:text-purple-300"
                >
                  <Globe className="h-4 w-4" />
                  <span>Web Search</span>
                </CommandItem>
                {user && (
                  <>
                    <CommandItem
                      onSelect={() => handleQuickAction('memories')}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-purple-500/20 hover:text-purple-300 cursor-pointer data-[selected]:bg-purple-500/30 data-[selected]:text-purple-300"
                    >
                      <Brain className="h-4 w-4" />
                      <span>View Memories</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleQuickAction('remember')}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-purple-500/20 hover:text-purple-300 cursor-pointer data-[selected]:bg-purple-500/30 data-[selected]:text-purple-300"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Remember Something</span>
                    </CommandItem>
                  </>
                )}
              </CommandGroup>
            </>
          )}

          {/* Chat History */}
          {user && filteredChats.length > 0 && (
            <CommandGroup heading="Chat History">
              {filteredChats.slice(0, 10).map((chat) => (
                <CommandItem
                  key={chat.id}
                  onSelect={() => handleSelectChat(chat.id)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-purple-500/20 hover:text-purple-300 cursor-pointer data-[selected]:bg-purple-500/30 data-[selected]:text-purple-300"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="truncate">{chat.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* AI Actions */}
          {search.length > 0 && (
            <CommandGroup heading="AI Actions">
              <CommandItem
                onSelect={() => {
                  router.push(`/chat?query=${encodeURIComponent(search)}`);
                  setOpen(false);
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-purple-500/20 hover:text-purple-300 cursor-pointer data-[selected]:bg-purple-500/30 data-[selected]:text-purple-300"
              >
                <Sparkles className="h-4 w-4" />
                <span>Ask: &quot;{search}&quot;</span>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

