import { render, screen, fireEvent, waitFor } from '@/test-utils/render'
import { LanguageSwitcher, LanguageSwitcherExpanded } from '../language-switcher'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

// Mock next/navigation
const mockPush = jest.fn()
const mockPathname = '/dashboard'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
  usePathname: jest.fn(() => mockPathname),
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: jest.fn(() => 'es'),
  useTranslations: jest.fn(() => (key: string) => key),
}))

// Mock i18n configuration
jest.mock('@/i18n', () => ({
  getAvailableLocales: jest.fn(() => [
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      flag: '🇪🇸',
    },
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
    },
    {
      code: 'pt',
      name: 'Portuguese',
      nativeName: 'Português',
      flag: '🇧🇷',
    },
  ]),
}))

// Mock UI components
jest.mock('@ui/components/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}))

jest.mock('@ui/components/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: any) => (
    <div data-testid="dropdown-trigger">{children}</div>
  ),
  DropdownMenuContent: ({ children, align, className }: any) => (
    <div data-testid="dropdown-content" data-align={align} className={className}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onClick, className }: any) => (
    <div
      data-testid="dropdown-item"
      onClick={onClick}
      className={className}
      role="menuitem"
    >
      {children}
    </div>
  ),
}))

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Globe: ({ className }: any) => <div data-testid="globe-icon" className={className} />,
  Check: ({ className }: any) => <div data-testid="check-icon" className={className} />,
}))

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
    ;(useLocale as jest.Mock).mockReturnValue('es')
  })

  describe('Rendering', () => {
    it('renders the language switcher button', () => {
      render(<LanguageSwitcher />)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('data-variant', 'ghost')
      expect(button).toHaveAttribute('data-size', 'sm')
    })

    it('renders the globe icon', () => {
      render(<LanguageSwitcher />)
      
      const globeIcon = screen.getByTestId('globe-icon')
      expect(globeIcon).toBeInTheDocument()
      expect(globeIcon).toHaveClass('h-4', 'w-4')
    })

    it('includes screen reader text', () => {
      render(<LanguageSwitcher />)
      
      const srText = screen.getByText('Switch language')
      expect(srText).toBeInTheDocument()
      expect(srText).toHaveClass('sr-only')
    })

    it('renders dropdown menu structure', () => {
      render(<LanguageSwitcher />)
      
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
      expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument()
      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument()
    })

    it('renders all available locales', () => {
      render(<LanguageSwitcher />)
      
      expect(screen.getByText('Español')).toBeInTheDocument()
      expect(screen.getByText('English')).toBeInTheDocument()
      expect(screen.getByText('Português')).toBeInTheDocument()
    })

    it('shows flags for each locale', () => {
      render(<LanguageSwitcher />)
      
      expect(screen.getByText('🇪🇸')).toBeInTheDocument()
      expect(screen.getByText('🇺🇸')).toBeInTheDocument()
      expect(screen.getByText('🇧🇷')).toBeInTheDocument()
    })

    it('shows check mark for current locale', () => {
      render(<LanguageSwitcher />)
      
      // Should show check mark for Spanish (current locale)
      const checkIcons = screen.getAllByTestId('check-icon')
      expect(checkIcons).toHaveLength(1)
    })
  })

  describe('Locale Change', () => {
    it('changes to English locale', async () => {
      render(<LanguageSwitcher />)
      
      const englishOption = screen.getByText('English').closest('[data-testid="dropdown-item"]')
      fireEvent.click(englishOption!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/dashboard')
      })
    })

    it('changes to Portuguese locale', async () => {
      render(<LanguageSwitcher />)
      
      const portugueseOption = screen.getByText('Português').closest('[data-testid="dropdown-item"]')
      fireEvent.click(portugueseOption!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/pt/dashboard')
      })
    })

    it('handles Spanish locale (default) correctly', async () => {
      render(<LanguageSwitcher />)
      
      const spanishOption = screen.getByText('Español').closest('[data-testid="dropdown-item"]')
      fireEvent.click(spanishOption!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('removes existing locale from pathname', async () => {
      ;(usePathname as jest.Mock).mockReturnValue('/en/dashboard')
      
      render(<LanguageSwitcher />)
      
      const spanishOption = screen.getByText('Español').closest('[data-testid="dropdown-item"]')
      fireEvent.click(spanishOption!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('handles root path correctly', async () => {
      ;(usePathname as jest.Mock).mockReturnValue('/')
      
      render(<LanguageSwitcher />)
      
      const englishOption = screen.getByText('English').closest('[data-testid="dropdown-item"]')
      fireEvent.click(englishOption!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/')
      })
    })

    it('handles nested paths correctly', async () => {
      ;(usePathname as jest.Mock).mockReturnValue('/courses/123/lessons/456')
      
      render(<LanguageSwitcher />)
      
      const englishOption = screen.getByText('English').closest('[data-testid="dropdown-item"]')
      fireEvent.click(englishOption!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/courses/123/lessons/456')
      })
    })
  })

  describe('Current Locale Display', () => {
    it('shows check mark only for current locale', () => {
      ;(useLocale as jest.Mock).mockReturnValue('en')
      
      render(<LanguageSwitcher />)
      
      const checkIcons = screen.getAllByTestId('check-icon')
      expect(checkIcons).toHaveLength(1)
      
      // Check mark should be next to English option
      const englishItem = screen.getByText('English').closest('[data-testid="dropdown-item"]')
      expect(englishItem).toContainElement(checkIcons[0])
    })

    it('updates check mark when locale changes', () => {
      const { rerender } = render(<LanguageSwitcher />)
      
      // Initially Spanish is selected
      let checkIcons = screen.getAllByTestId('check-icon')
      expect(checkIcons).toHaveLength(1)
      
      // Change to English
      ;(useLocale as jest.Mock).mockReturnValue('en')
      rerender(<LanguageSwitcher />)
      
      checkIcons = screen.getAllByTestId('check-icon')
      expect(checkIcons).toHaveLength(1)
      
      const englishItem = screen.getByText('English').closest('[data-testid="dropdown-item"]')
      expect(englishItem).toContainElement(checkIcons[0])
    })
  })

  describe('Accessibility', () => {
    it('has proper button attributes', () => {
      render(<LanguageSwitcher />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'ghost')
      expect(button).toHaveAttribute('data-size', 'sm')
    })

    it('has screen reader accessible text', () => {
      render(<LanguageSwitcher />)
      
      const srText = screen.getByText('Switch language')
      expect(srText).toBeInTheDocument()
    })

    it('dropdown items have proper role', () => {
      render(<LanguageSwitcher />)
      
      const menuItems = screen.getAllByRole('menuitem')
      expect(menuItems).toHaveLength(3)
    })

    it('dropdown content has proper alignment', () => {
      render(<LanguageSwitcher />)
      
      const dropdownContent = screen.getByTestId('dropdown-content')
      expect(dropdownContent).toHaveAttribute('data-align', 'end')
    })
  })

  describe('Styling', () => {
    it('applies glass morphism classes', () => {
      render(<LanguageSwitcher />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('glass-morphism')
      
      const dropdownContent = screen.getByTestId('dropdown-content')
      expect(dropdownContent).toHaveClass('glass-morphism')
    })

    it('applies correct size classes', () => {
      render(<LanguageSwitcher />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-8', 'w-8', 'px-0')
      
      const dropdownContent = screen.getByTestId('dropdown-content')
      expect(dropdownContent).toHaveClass('w-48')
    })
  })
})

describe('LanguageSwitcherExpanded', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
    ;(useLocale as jest.Mock).mockReturnValue('es')
  })

  describe('Rendering', () => {
    it('renders the expanded language switcher', () => {
      render(<LanguageSwitcherExpanded />)
      
      expect(screen.getByText('🌍 Idioma / Language')).toBeInTheDocument()
    })

    it('renders all language options as buttons', () => {
      render(<LanguageSwitcherExpanded />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
    })

    it('shows both native and English names', () => {
      render(<LanguageSwitcherExpanded />)
      
      expect(screen.getByText('Español')).toBeInTheDocument()
      expect(screen.getByText('Spanish')).toBeInTheDocument()
      expect(screen.getByText('English')).toBeInTheDocument()
      expect(screen.getByText('Português')).toBeInTheDocument()
      expect(screen.getByText('Portuguese')).toBeInTheDocument()
    })

    it('shows flags for each language', () => {
      render(<LanguageSwitcherExpanded />)
      
      expect(screen.getByText('🇪🇸')).toBeInTheDocument()
      expect(screen.getByText('🇺🇸')).toBeInTheDocument()
      expect(screen.getByText('🇧🇷')).toBeInTheDocument()
    })

    it('highlights current language button', () => {
      render(<LanguageSwitcherExpanded />)
      
      const buttons = screen.getAllByRole('button')
      const spanishButton = buttons.find(button => 
        button.textContent?.includes('Español')
      )
      
      expect(spanishButton).toHaveAttribute('data-variant', 'default')
    })

    it('shows check mark for current language', () => {
      render(<LanguageSwitcherExpanded />)
      
      const checkIcons = screen.getAllByTestId('check-icon')
      expect(checkIcons).toHaveLength(1)
    })
  })

  describe('Locale Change', () => {
    it('changes locale when language button is clicked', async () => {
      render(<LanguageSwitcherExpanded />)
      
      const buttons = screen.getAllByRole('button')
      const englishButton = buttons.find(button => 
        button.textContent?.includes('English')
      )
      
      fireEvent.click(englishButton!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/dashboard')
      })
    })

    it('handles Portuguese selection', async () => {
      render(<LanguageSwitcherExpanded />)
      
      const buttons = screen.getAllByRole('button')
      const portugueseButton = buttons.find(button => 
        button.textContent?.includes('Português')
      )
      
      fireEvent.click(portugueseButton!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/pt/dashboard')
      })
    })

    it('handles Spanish (default) selection', async () => {
      render(<LanguageSwitcherExpanded />)
      
      const buttons = screen.getAllByRole('button')
      const spanishButton = buttons.find(button => 
        button.textContent?.includes('Español')
      )
      
      fireEvent.click(spanishButton!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })
  })

  describe('Visual States', () => {
    it('shows different variants for current vs other languages', () => {
      render(<LanguageSwitcherExpanded />)
      
      const buttons = screen.getAllByRole('button')
      
      const spanishButton = buttons.find(button => 
        button.textContent?.includes('Español')
      )
      const englishButton = buttons.find(button => 
        button.textContent?.includes('English')
      )
      
      expect(spanishButton).toHaveAttribute('data-variant', 'default')
      expect(englishButton).toHaveAttribute('data-variant', 'ghost')
    })

    it('applies proper styling classes', () => {
      render(<LanguageSwitcherExpanded />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('glass-morphism')
        expect(button).toHaveClass('justify-start')
        expect(button).toHaveClass('h-auto')
        expect(button).toHaveClass('p-3')
        expect(button).toHaveClass('text-left')
      })
    })
  })

  describe('Layout', () => {
    it('uses grid layout for language options', () => {
      const { container } = render(<LanguageSwitcherExpanded />)
      
      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
      expect(grid).toHaveClass('gap-2')
    })

    it('has proper spacing', () => {
      const { container } = render(<LanguageSwitcherExpanded />)
      
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('space-y-2')
    })
  })

  describe('Accessibility', () => {
    it('has descriptive heading', () => {
      render(<LanguageSwitcherExpanded />)
      
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toHaveTextContent('🌍 Idioma / Language')
    })

    it('buttons are keyboard accessible', () => {
      render(<LanguageSwitcherExpanded />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
        // Buttons should be focusable by default
      })
    })
  })
})

describe('Language Switcher Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('handles empty pathname', () => {
    ;(usePathname as jest.Mock).mockReturnValue('')
    
    render(<LanguageSwitcher />)
    
    const englishOption = screen.getByText('English').closest('[data-testid="dropdown-item"]')
    fireEvent.click(englishOption!)
    
    expect(mockPush).toHaveBeenCalledWith('/en/')
  })

  it('handles pathname with existing locale prefix', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/pt/courses')
    
    render(<LanguageSwitcher />)
    
    const englishOption = screen.getByText('English').closest('[data-testid="dropdown-item"]')
    fireEvent.click(englishOption!)
    
    expect(mockPush).toHaveBeenCalledWith('/en/courses')
  })

  it('handles unknown current locale gracefully', () => {
    ;(useLocale as jest.Mock).mockReturnValue('fr') // French not in available locales
    
    render(<LanguageSwitcher />)
    
    // Should not show any check marks
    const checkIcons = screen.queryAllByTestId('check-icon')
    expect(checkIcons).toHaveLength(0)
  })
})