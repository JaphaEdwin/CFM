import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function ThemeToggle({ variant = 'ghost', size = 'icon' }: { variant?: 'ghost' | 'outline'; size?: 'icon' | 'sm' }) {
  const { theme, toggleTheme } = useTheme();

  const icon = theme === 'light' ? (
    <Sun className="w-5 h-5" />
  ) : theme === 'dark' ? (
    <Moon className="w-5 h-5" />
  ) : (
    <Monitor className="w-5 h-5" />
  );

  const label = theme === 'light' ? 'Light mode' : theme === 'dark' ? 'Dark mode' : 'System theme';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={toggleTheme}
          className="text-foreground/70 hover:text-foreground"
          aria-label={label}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
