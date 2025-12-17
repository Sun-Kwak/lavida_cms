// React Icons JSX 호환성을 위한 타입 선언
declare module 'react-icons/md' {
  import { FC, SVGProps } from 'react';
  
  export const MdFormatBold: FC<SVGProps<SVGSVGElement>>;
  export const MdFormatItalic: FC<SVGProps<SVGSVGElement>>;
  export const MdFormatUnderlined: FC<SVGProps<SVGSVGElement>>;
  export const MdStrikethroughS: FC<SVGProps<SVGSVGElement>>;
  export const MdHighlight: FC<SVGProps<SVGSVGElement>>;
  export const MdLink: FC<SVGProps<SVGSVGElement>>;
  export const MdLinkOff: FC<SVGProps<SVGSVGElement>>;
  export const MdFormatAlignLeft: FC<SVGProps<SVGSVGElement>>;
  export const MdFormatAlignCenter: FC<SVGProps<SVGSVGElement>>;
  export const MdFormatAlignRight: FC<SVGProps<SVGSVGElement>>;
  export const MdFormatListBulleted: FC<SVGProps<SVGSVGElement>>;
  export const MdFormatListNumbered: FC<SVGProps<SVGSVGElement>>;
  export const MdFormatQuote: FC<SVGProps<SVGSVGElement>>;
  export const MdInsertPhoto: FC<SVGProps<SVGSVGElement>>;
  export const MdFormatLineSpacing: FC<SVGProps<SVGSVGElement>>;
  export const MdSpaceBar: FC<SVGProps<SVGSVGElement>>;
}
