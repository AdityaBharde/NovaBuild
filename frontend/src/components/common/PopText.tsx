import React from 'react';
import { motion, type Variants } from 'motion/react';

const popEase = [0.34, 1.4, 0.64, 1] as [number, number, number, number];

const wordPop: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.72 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: popEase },
  },
};

const lineStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.06 },
  },
};

function wrapText(node: React.ReactNode): React.ReactNode {
  if (node == null || typeof node === 'boolean') {
    return node;
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
      .split(/(\s+)/)
      .map((part, index) => {
        if (part === '') {
          return null;
        }

        if (/^\s+$/.test(part)) {
          return <span key={`s-${index}`}>{part}</span>;
        }

        return (
          <motion.span key={`w-${index}`} className="scroll-pop-word" variants={wordPop}>
            {part}
          </motion.span>
        );
      });
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <React.Fragment key={index}>{wrapText(child)}</React.Fragment>
    ));
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    if (node.type === 'br') {
      return node;
    }

    return React.cloneElement(node, undefined, wrapText(node.props.children));
  }

  return node;
}

type PopTag = 'h1' | 'h2' | 'h3' | 'p' | 'div';

interface PopTextProps {
  as?: PopTag;
  className?: string;
  children: React.ReactNode;
  amount?: number;
  delay?: number;
}

export const PopText: React.FC<PopTextProps> = ({
  as = 'p',
  className,
  children,
  amount = 0.4,
  delay,
}) => {
  const Tag = motion[as];

  const variants = React.useMemo<Variants>(() => {
    if (delay === undefined) {
      return lineStagger;
    }
    return {
      hidden: {},
      visible: {
        transition: { staggerChildren: 0.045, delayChildren: delay },
      },
    };
  }, [delay]);

  return (
    <Tag
      className={className}
      data-pop-text=""
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount, margin: '0px 0px -8% 0px' }}
    >
      {wrapText(children)}
    </Tag>
  );
};
