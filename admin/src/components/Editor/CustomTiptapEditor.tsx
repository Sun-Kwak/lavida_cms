import { useEditor, EditorContent, Editor } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import ImageResize from "tiptap-extension-resize-image";
import GapCursor from "@tiptap/extension-gapcursor";
import { Extension } from "@tiptap/core";
import { Node } from "@tiptap/core";
import Underline from "@tiptap/extension-underline";

import { Plugin, PluginKey } from "prosemirror-state";
import React, { useCallback, useEffect, useState } from "react";
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdStrikethroughS,
  MdHighlight,
  MdLink,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
} from "react-icons/md";

import "./Tiptap.css";
import "./BubbleMenu.css";
import MenuBar from "./MenuBar";

// 폰트 크기 확장을 위한 커스텀 설정
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontSize.replace(/['"]+/g, ""),
        renderHTML: (attributes: any) => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
      lineHeight: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.lineHeight || null,
        renderHTML: (attributes: any) => {
          if (!attributes.lineHeight) return {};
          return { style: `line-height: ${attributes.lineHeight}` };
        },
      },

      letterSpacing: {
        default: "0",
        parseHTML: (element: HTMLElement) => element.style.letterSpacing,
        renderHTML: (attributes: any) => {
          if (!attributes.letterSpacing) {
            return {};
          }
          return {
            style: `letter-spacing: ${attributes.letterSpacing}`,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ commands }: any) => {
          return commands.setMark(this.name, { fontSize: fontSize });
        },
      unsetFontSize:
        () =>
        ({ commands }: any) => {
          return commands.unsetMark(this.name);
        },
      setLineHeight:
        (lineHeight: string) =>
        ({ commands }: any) => {
          return commands.setMark(this.name, { lineHeight: lineHeight });
        },
      setLetterSpacing:
        (letterSpacing: string) =>
        ({ commands }: any) => {
          return commands.setMark(this.name, { letterSpacing: letterSpacing });
        },
    };
  },
});

const uploadImage = async (file: File) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);

  return new Promise<string>((resolve, reject) => {
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
  });
};

// 이미지 노드 확장 설정
const CustomImage = Image.extend({
  renderHTML({ HTMLAttributes }: { HTMLAttributes: any }) {
    return ["div", { class: "image-container" }, ["img", HTMLAttributes]];
  },
});

// YouTube 노드 정의
const YouTube = Node.create({
  name: "youtube",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: 640,
      },
      height: {
        default: 360,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[src*="youtube.com"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { class: "youtube-video-container" },
      [
        "iframe",
        {
          ...HTMLAttributes,
          frameborder: "0",
          allowfullscreen: "true",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        },
      ],
    ];
  },
});

// YouTube 링크 감지 및 변환 확장
const YouTubeExtension = Extension.create({
  name: "youtubeExtension",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("youtube-extension"),
        props: {
          handlePaste: (view, event) => {
            if (!event.clipboardData) return false;

            const text = event.clipboardData.getData("text/plain");
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
            const match = text.match(youtubeRegex);

            if (match) {
              const videoId = match[1];
              const embedUrl = `https://www.youtube.com/embed/${videoId}`;

              view.dispatch(
                view.state.tr.replaceSelectionWith(view.state.schema.nodes.youtube.create({ src: embedUrl }))
              );

              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});

interface CustomTiptapEditorProps {
  content?: string;
  initialContent?: string;
  onChange?: (content: string) => void;
  onEditorReady?: (editor: Editor) => void;
  placeholder?: string;
  onEditorUpdate?: (newContent: string) => void;
  showMenuBar?: boolean; // 메뉴바 표시 여부 (기본값: true)
  readOnly?: boolean; // 읽기 전용 모드 (기본값: false)
  enableImageUpload?: boolean; // 이미지 업로드 기능 활성화 여부 (기본값: true)
  height?: string | number; // 에디터 높이 (기본값: 300px)
  hideBorder?: boolean; // 보더 숨김 여부 (기본값: false)
}

const CustomTiptapEditor = ({
  content,
  initialContent = "",
  onChange,
  onEditorReady,
  placeholder,
  onEditorUpdate,
  showMenuBar = true,
  readOnly = false,
  enableImageUpload = true,
  height = 300,
  hideBorder = false,
}: CustomTiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit의 기본 Heading, Bold 등 외 추가/제외 설정 가능
        // 예: heading: { levels: [1, 2, 3] }
        // 기본적으로 Bold, Italic, Strike, Code, Paragraph, Blockquote, BulletList, OrderedList 등 포함
        gapcursor: false,
        // Underline과 Link는 별도로 추가하므로 StarterKit에서 제외
        link: false, // Link extension을 StarterKit에서 제외
        underline: false, // Underline extension을 StarterKit에서 제외
      }),
      Highlight,
      TextAlign.configure({
        types: ["heading", "paragraph"], // 정렬을 적용할 노드 타입 지정
      }),
      // TextStyle, // FontFamily, FontSize 사용을 위해 필요
      FontFamily,
      FontSize, // 커스텀 FontSize 확장 사용
      Link.configure({
        openOnClick: true, // 링크 클릭 시 새 탭에서 열기
        autolink: true, // URL 자동 링크 변환
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Underline,
      GapCursor,
      CustomImage.configure({
        inline: true,
        allowBase64: true,
      }),
      ImageResize.configure({
        // 이미지 크기 제한 해제 - 사용자가 자유롭게 조절할 수 있도록
        // minWidth: 100, // 최소 너비 제한 해제
        // maxWidth: 200, // 최대 너비 제한 해제  
        // autoHeight: true, // 높이는 자동으로 맞춰주기
      }),
      YouTube,
      YouTubeExtension,
    ],
    content: content || initialContent,
    immediatelyRender: false,
    editable: !readOnly, // 읽기 전용 모드 설정
    onUpdate: ({ editor }) => {
      if (!readOnly) { // 읽기 전용이 아닐 때만 onChange 실행
        const html = editor.getHTML();
        if (onChange) {
          onChange(html);
        }
        if (onEditorUpdate) {
          onEditorUpdate(html);
        }
      }
    },
    editorProps: {
      attributes: {
        // 에디터 자체에 클래스 추가 가능
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
      },
      handleDrop: (view, event, slice, moved) => {
        // 이미지 업로드가 비활성화된 경우 드래그앤드롭 처리하지 않음
        if (!enableImageUpload) {
          return false;
        }

        event.preventDefault();
        const files = event.dataTransfer?.files;

        if (files && files.length) {
          // 여러 이미지 파일을 처리하기 위해 Array.from(files)를 사용
          const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));

          imageFiles.forEach((imageFile) => {
            // 각 이미지를 Base64로 변환하여 URL 가져오기
            uploadImage(imageFile).then((imageUrl) => {
              // URL로 이미지를 에디터에 삽입
              view.dispatch(
                view.state.tr.replaceSelectionWith(view.state.schema.nodes.image.create({ src: imageUrl }))
              );
            });
          });
        }

        return true; // 드롭 처리 완료
      },
    },
  });

  // setLink 함수 (MenuBar와 BubbleMenu에서 사용)
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL을 입력하세요", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // 커스텀 BubbleMenu 컴포넌트
  const CustomBubbleMenu = () => {
    const [showBubbleMenu, setShowBubbleMenu] = useState(false);
    const { refs, floatingStyles } = useFloating({
      middleware: [offset(10), flip(), shift()],
      whileElementsMounted: autoUpdate,
    });

    useEffect(() => {
      if (!editor) return;

      const updateBubbleMenu = () => {
        const { selection } = editor.state;
        const { from, to } = selection;
        
        if (from === to) {
          setShowBubbleMenu(false);
          return;
        }

        setShowBubbleMenu(true);
        
        // selection의 DOM 위치를 참조로 설정
        const domSelection = window.getSelection();
        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // 가상 참조 엘리먼트 생성
          refs.setReference({
            getBoundingClientRect: () => rect,
          });
        }
      };

      editor.on('selectionUpdate', updateBubbleMenu);
      editor.on('update', updateBubbleMenu);

      return () => {
        editor.off('selectionUpdate', updateBubbleMenu);
        editor.off('update', updateBubbleMenu);
      };
    }, [refs]);

    if (!showBubbleMenu || !editor) return null;

    return (
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="tiptap-bubble-menu"
      >
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "is-active" : ""}
        >
          <MdFormatBold />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "is-active" : ""}
        >
          <MdFormatItalic />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "is-active" : ""}
        >
          <MdFormatUnderlined />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "is-active" : ""}
        >
          <MdStrikethroughS />
        </button>
        <button onClick={setLink} className={editor.isActive("link") ? "is-active" : ""}>
          <MdLink />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={editor.isActive("highlight") ? "is-active" : ""}
        >
          <MdHighlight />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={editor.isActive({ textAlign: "left" }) ? "is-active" : ""}
        >
          <MdFormatAlignLeft />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={editor.isActive({ textAlign: "center" }) ? "is-active" : ""}
        >
          <MdFormatAlignCenter />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={editor.isActive({ textAlign: "right" }) ? "is-active" : ""}
        >
          <MdFormatAlignRight />
        </button>
      </div>
    );
  };

  // 에디터가 준비되면 콜백 호출
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // 에디터 컨테이너 클릭 시 포커스 핸들러
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // 에디터 영역이 아닌 컨테이너 빈 공간을 클릭했을 때만 포커스
    const target = e.target as HTMLElement;
    if (target.classList.contains('editor-container') || 
        target.classList.contains('tiptap-editor-content') ||
        target.closest('.tiptap-editor-content')) {
      editor?.commands.focus();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  // 높이 값 처리 (문자열이면 그대로, 숫자면 px 추가)
  const editorHeight = typeof height === 'number' ? `${height}px` : height;
  const editorContentHeight = typeof height === 'number' ? `${height - 50}px` : `calc(${height} - 50px)`;

  return (
    <div 
      className={`editor-container ${hideBorder ? 'hide-border' : ''}`}
      onClick={handleContainerClick}
      style={{ 
        minHeight: editorHeight, 
        height: editorHeight,
        border: hideBorder ? 'none' : undefined,
        outline: hideBorder ? 'none' : undefined
      }}
    >
      {showMenuBar && <MenuBar editor={editor} enableImageUpload={enableImageUpload} />}
      <CustomBubbleMenu />
      <EditorContent 
        editor={editor} 
        className={`tiptap-editor-content ${hideBorder ? 'hide-border' : ''}`}
        style={{ 
          minHeight: editorContentHeight, 
          height: editorContentHeight,
          border: hideBorder ? 'none' : undefined,
          outline: hideBorder ? 'none' : undefined
        }}
      />
    </div>
  );
};

export default CustomTiptapEditor;
