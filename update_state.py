import re

with open(r'c:\Users\Martin\Documents\Korat-Flow-Agencia\Korat_MVP\pages\Calendar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Z-indexes
content = content.replace(
    '<div className="field-fade-in" style={{ animationDelay: \'0.05s\' }}>',
    '<div className="field-fade-in relative z-[60]" style={{ animationDelay: \'0.05s\' }}>'
)
content = content.replace(
    '<div className="field-fade-in" style={{ animationDelay: \'0.1s\' }}>',
    '<div className="field-fade-in relative z-[50]" style={{ animationDelay: \'0.1s\' }}>'
)
content = content.replace(
    '<div className="field-fade-in" style={{ animationDelay: \'0.15s\' }}>',
    '<div className="field-fade-in relative z-[40]" style={{ animationDelay: \'0.15s\' }}>'
)
content = content.replace(
    '<div className="field-fade-in" style={{ animationDelay: \'0.2s\' }}>',
    '<div className="field-fade-in relative z-[30]" style={{ animationDelay: \'0.2s\' }}>'
)

# Add state variables
state_injection = """  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);"""

content = re.sub(
    r'  const \[clientSearch, setClientSearch\] = useState\(\'\'\);\n  const \[isClientDropdownOpen, setIsClientDropdownOpen\] = useState\(false\);',
    state_injection,
    content
)

# Add ref
ref_injection = """  const clientDropdownRef = useRef<HTMLDivElement>(null);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);"""

content = re.sub(
    r'  const clientDropdownRef = useRef<HTMLDivElement>\(null\);',
    ref_injection,
    content
)

# Add click outside listener for service dropdown
listener_injection = """    const handleClickOutside = (event: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setIsClientDropdownOpen(false);
      }
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setIsServiceDropdownOpen(false);
      }
    };"""

content = re.sub(
    r'    const handleClickOutside = \(event: MouseEvent\) => \{\n      if \(clientDropdownRef\.current && !clientDropdownRef\.current\.contains\(event\.target as Node\)\) \{\n        setIsClientDropdownOpen\(false\);\n      \}\n    \};',
    listener_injection,
    content
)

with open(r'c:\Users\Martin\Documents\Korat-Flow-Agencia\Korat_MVP\pages\Calendar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Z-index, state, ref, and listeners injected')
