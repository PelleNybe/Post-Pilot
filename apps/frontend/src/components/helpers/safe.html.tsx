import React, { FC, useMemo } from 'react';

export const SafeHtml: FC<{ html?: string | null; className?: string }> = ({
  html,
  className,
}) => {
  const content = useMemo(() => {
    const safeInput = typeof html === 'string' ? html : '';
    const regex = /(<br\s*\/?>|<\/?p>|<strong>.*?<\/strong>|<em>.*?<\/em>|<span[^>]*>.*?<\/span>|<a[^>]*>.*?<\/a>|\bhttps?:\/\/[^\s<]+[^<.,:;"')\]\s])/gi;

    const parts = safeInput.split(regex).filter(Boolean);

    return parts.map((part, index) => {
      if (part.match(/^https?:\/\//i)) {
        return (
          <a
            key={index}
            className="cursor-pointer underline text-blue-500"
            target="_blank"
            rel="noopener noreferrer"
            href={part}
          >
            {part}
          </a>
        );
      }

      if (part.match(/^<br\s*\/?>$/i)) {
        return <br key={index} />;
      }

      if (part.match(/^<p>$/i) || part.match(/^<\/p>$/i)) {
        return part.match(/^<p>$/i) ? <div key={index} className="mb-2" /> : null;
      }

      if (part.match(/^<strong>(.*?)<\/strong>$/i)) {
        const text = part.replace(/^<strong>(.*?)<\/strong>$/i, '$1');
        return <strong key={index}>{text}</strong>;
      }

      if (part.match(/^<em>(.*?)<\/em>$/i)) {
        const text = part.replace(/^<em>(.*?)<\/em>$/i, '$1');
        return <em key={index}>{text}</em>;
      }

      if (part.match(/^<span[^>]*>(.*?)<\/span>$/i)) {
        const text = part.replace(/^<span[^>]*>(.*?)<\/span>$/i, '$1');
        return <span key={index} className="font-bold text-blue-400">{text}</span>;
      }

      if (part.match(/^<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>$/i)) {
        const matches = part.match(/^<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>$/i);
        if (matches) {
          const href = matches[1].trim();
          const isSafeHref =
            /^https?:\/\//i.test(href) || href.startsWith('/');
          if (!isSafeHref) {
            return matches[2];
          }
          return (
            <a
              key={index}
              className="cursor-pointer underline text-blue-500"
              target="_blank"
              rel="noopener noreferrer"
              href={href}
            >
              {matches[2]}
            </a>
          );
        }
      }

      return part.replace(/<[^>]*>?/gm, '');
    });
  }, [html]);

  return <div className={className}>{content}</div>;
};
