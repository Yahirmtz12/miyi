"use strict";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "../../lib/utils";

export const TextGenerateEffect = ({ words, className }) => {
  const [scope, animate] = useAnimate();
  let wordsArray = words.split(" ");
  useEffect(() => {
    animate("span", { opacity: 1 }, { duration: 2, delay: stagger(0.2) });
  }, [scope.current]);

  return (
    <div className={cn("font-bold", className)}>
      <div className="mt-4">
        <div className="text-white text-2xl leading-snug tracking-wide" ref={scope}>
          {wordsArray.map((word, idx) => (
            <motion.span key={word + idx} className="opacity-0">
              {word}{" "}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
};