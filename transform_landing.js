const fs = require('fs');

try {
  let landing = fs.readFileSync('pages/Landing.tsx', 'utf8');

  // Replace emojis with Lucide React icons where they appear
  landing = landing.replace(/📋/g, '');
  landing = landing.replace(/⏸️/g, '');
  landing = landing.replace(/⚡/g, '');
  landing = landing.replace(/📝/g, '<FileText size={40} className="text-violet-500" />');
  landing = landing.replace(/⚙️/g, '<Settings size={40} className="text-violet-500" />');
  landing = landing.replace(/🚀/g, '<Rocket size={40} className="text-violet-500" />');

  // Strip useIntersectionObserver definition completely
  landing = landing.replace(/const useIntersectionObserver = \(\) => \{[\s\S]*?return visibleSections;\s*\};\s*/, '');

  // Strip usage `const visibleSections = useIntersectionObserver();`
  landing = landing.replace(/const visibleSections = useIntersectionObserver\(\);/g, '');

  // Strip `getAnimationClass` definition
  landing = landing.replace(/const getAnimationClass =[^}]+};\s*/g, '');

  // Remove data-animate attributes
  landing = landing.replace(/data-animate/g, '');

  // Remove class interpolations logic
  landing = landing.replace(/\$\{getAnimationClass\('[^']+'(?:,\s*'[^']+')?\)\}/g, '');

  // Clean empty backticks in classNames
  landing = landing.replace(/className=\{\`(.*?)\s*\`\}/g, (match, p1) => {
      let cleaned = p1.trim();
      if(cleaned) {
          return 'className=\"' + cleaned + '\"';
      }
      return '';
  });

  fs.writeFileSync('pages/Landing.tsx', landing);
  console.log("Transformation completed successfully.");
} catch (err) {
  console.error(err);
}
