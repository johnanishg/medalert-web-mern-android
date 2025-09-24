import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../contexts/TranslationContext';

interface TransProps {
  children: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

const Trans: React.FC<TransProps> = ({ children, as = 'span', className }) => {
  const { language, translateText } = useTranslation();
  const [text, setText] = useState<string>(children);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const t = await translateText(children);
        if (!cancelled) setText(t);
      } catch {
        if (!cancelled) setText(children);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [children, language, translateText]);

  const Element: any = as;
  return <Element className={className}>{text}</Element>;
};

export default Trans;
