'use client';

import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core';
import { useExistingData } from '@postpilot/frontend/components/launches/helpers/use.existing.data';
import { InformationComponent } from '@postpilot/frontend/components/launches/information.component';
import { UpDownArrow } from '@postpilot/frontend/components/launches/up.down.arrow';
import { MultiMediaComponent } from '@postpilot/frontend/components/media/media.component';
import { useUppyUploader } from '@postpilot/frontend/components/media/new.uploader';
import { AComponent } from '@postpilot/frontend/components/new-launch/a.component';
import { AddPostButton } from '@postpilot/frontend/components/new-launch/add.post.button';
import { BoldText } from '@postpilot/frontend/components/new-launch/bold.text';
import { Bullets } from '@postpilot/frontend/components/new-launch/bullets.component';
import { DelayComponent } from '@postpilot/frontend/components/new-launch/delay.component';
import { HeadingComponent } from '@postpilot/frontend/components/new-launch/heading.component';
import { suggestion } from '@postpilot/frontend/components/new-launch/mention.component';
import {
  type SelectedIntegrations,
  useLaunchStore,
} from '@postpilot/frontend/components/new-launch/store';
import { UText } from '@postpilot/frontend/components/new-launch/u.text';
import { SignatureBox } from '@postpilot/frontend/components/signature';
import {
  ConnectionLineIcon,
  DelayIcon,
  EmojiIcon,
  LockIcon,
  ResetIcon,
  TrashIcon,
} from '@postpilot/frontend/components/ui/icons';
import { useFetch } from '@postpilot/helpers/utils/custom.fetch';
import { stripHtmlValidation } from '@postpilot/helpers/utils/strip.html.validation';
import { makeId } from '@postpilot/nestjs-libraries/services/make.is';
import { deleteDialog } from '@postpilot/react/helpers/delete.dialog';
import { useToaster } from '@postpilot/react/toaster/toaster';
import { useT } from '@postpilot/react/translation/get.transation.service.client';
import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import { History } from '@tiptap/extension-history';
import Link from '@tiptap/extension-link';
import { BulletList, ListItem } from '@tiptap/extension-list';
import Mention from '@tiptap/extension-mention';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Underline from '@tiptap/extension-underline';
import { Placeholder } from '@tiptap/extensions';
import {
  EditorContent,
  Extension,
  mergeAttributes,
  useEditor,
} from '@tiptap/react';
import { Dashboard } from '@uppy/react';
import clsx from 'clsx';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import React, {
  type ClipboardEvent,
  type FC,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDropzone } from 'react-dropzone';
import { useShallow } from 'zustand/react/shallow';
import { appendUtmsToUrls, calculateReadability, calculateSentiment, splitIntoThread } from './utils/text.utils';

const MAX_UPLOAD_SIZE = 1024 * 1024 * 1024; // 1 GB

const InterceptBoldShortcut = Extension.create({
  name: 'preventBoldWithUnderline',

  addKeyboardShortcuts() {
    return {
      'Mod-b': () => {
        // For example, toggle bold while removing underline
        this?.editor?.commands?.unsetUnderline();
        return this?.editor?.commands?.toggleBold();
      },
    };
  },
});

const InterceptUnderlineShortcut = Extension.create({
  name: 'preventUnderlineWithUnderline',

  addKeyboardShortcuts() {
    return {
      'Mod-u': () => {
        // For example, toggle bold while removing underline
        this?.editor?.commands?.unsetBold();
        return this?.editor?.commands?.toggleUnderline();
      },
    };
  },
});

export const EditorWrapper: FC<{
  totalPosts: number;
  value: string;
}> = React.memo(() => {
  const t = useT();
  const {
    setGlobalValueText,
    setInternalValueText,
    addRemoveInternal,
    internal,
    global,
    current,
    addInternalValue,
    addGlobalValue,
    setInternalValueMedia,
    appendInternalValueMedia,
    appendGlobalValueMedia,
    setGlobalValueMedia,
    changeOrderGlobal,
    changeOrderInternal,
    isCreateSet,
    deleteGlobalValue,
    deleteInternalValue,
    setGlobalValue,
    setInternalValue,
    setInternalDelay,
    setGlobalDelay,
    internalFromAll,
    totalChars,
    postComment,
    isGlobalPlatform,
    editor,
    loadedState,
    setLoadedState,
    selectedIntegration,
    chars,
    comments,
  } = useLaunchStore(
    useShallow((state) => ({
      internal: state.internal.find((p) => p.integration.id === state.current),
      internalFromAll: state.integrations.find((p) => p.id === state.current),
      global: state.global,
      comments: state.comments,
      current: state.current,
      addRemoveInternal: state.addRemoveInternal,
      isGlobalPlatform: state.isGlobalPlatform,
      setInternalValueText: state.setInternalValueText,
      setGlobalValueText: state.setGlobalValueText,
      addInternalValue: state.addInternalValue,
      addGlobalValue: state.addGlobalValue,
      setGlobalValueMedia: state.setGlobalValueMedia,
      setInternalValueMedia: state.setInternalValueMedia,
      changeOrderGlobal: state.changeOrderGlobal,
      changeOrderInternal: state.changeOrderInternal,
      isCreateSet: state.isCreateSet,
      deleteGlobalValue: state.deleteGlobalValue,
      deleteInternalValue: state.deleteInternalValue,
      setGlobalValue: state.setGlobalValue,
      setInternalValue: state.setInternalValue,
      setGlobalDelay: state.setGlobalDelay,
      setInternalDelay: state.setInternalDelay,
      totalChars: state.totalChars,
      appendInternalValueMedia: state.appendInternalValueMedia,
      appendGlobalValueMedia: state.appendGlobalValueMedia,
      postComment: state.postComment,
      editor: state.editor,
      loadedState: state.loaded,
      setLoadedState: state.setLoaded,
      selectedIntegration: state.selectedIntegrations,
      chars: state.chars,
    }))
  );


  const existingData = useExistingData();
  const [loaded, setLoaded] = useState(true);

  useEffect(() => {
    if (loaded && loadedState) {
      return;
    }

    setLoadedState(true);
    setLoaded(true);
  }, [loaded, loadedState]);

  const canEdit = useMemo(() => {
    return current === 'global' || !!internal;
  }, [current, internal]);

  const items = useMemo(() => {
    if (internal) {
      return internal.integrationValue;
    }

    return global;
  }, [internal, global]);

  const setValue = useCallback(
    (value: string[]) => {
      const newValue = value.map((p, index) => {
        return {
          id: makeId(10),
          delay: 0,
          ...(items?.[index]?.media
            ? { media: items[index].media }
            : { media: [] }),
          content: p,
        };
      });
      if (internal) {
        return setInternalValue(current, newValue);
      }

      return setGlobalValue(newValue);
    },
    [internal, items]
  );


  useCopilotReadable({
    description: 'Current content of posts',
    value: items.map((p) => p.content),
  });

  useCopilotAction({
    name: 'setPosts',
    description: 'a thread of posts',
    parameters: [
      {
        name: 'content',
        type: 'string[]',
        description: 'a thread of posts',
      },
    ],
    handler: async ({ content }) => {
      setValue(content);
    },
  });

  const changeValue = useCallback(
    (index: number) => (value: string) => {
      if (internal) {
        return setInternalValueText(current, index, value);
      }

      return setGlobalValueText(index, value);
    },
    [current, global, internal]
  );


  const changeImages = useCallback(
    (index: number) => (value: any[]) => {
      if (internal) {
        return setInternalValueMedia(current, index, value);
      }

      return setGlobalValueMedia(index, value);
    },
    [current, global, internal]
  );


  const appendImages = useCallback(
    (index: number) => (value: any[]) => {
      if (internal) {
        return appendInternalValueMedia(current, index, value);
      }

      return appendGlobalValueMedia(index, value);
    },
    [current, global, internal]
  );


  const changeOrder = useCallback(
    (index: number) => (direction: 'up' | 'down') => {
      if (internal) {
        changeOrderInternal(current, index, direction);
        return setLoaded(false);
      }

      changeOrderGlobal(index, direction);
      setLoaded(false);
    },
    [changeOrderInternal, changeOrderGlobal, current, global, internal]
  );


  const goBackToGlobal = useCallback(async () => {
    if (
      await deleteDialog(
        t(
          'are_you_sure_go_back_to_global_mode',
          'This action is irreversible. Are you sure you want to go back to global mode?'
        ),
        t('yes_go_back_to_global_mode', 'Yes, go back to global mode')
      )
    ) {
      setLoaded(false);
      addRemoveInternal(current);
    }
  }, [addRemoveInternal, current, t]);

  const addValue = useCallback(
    (index: number) => () => {
      setTimeout(() => {
        // scroll the the bottom
        document.querySelector('#social-content').scrollTo({
          top: document.querySelector('#social-content').scrollHeight,
        });
      }, 20);
      if (internal) {
        return addInternalValue(index, current, [
          {
            delay: 0,
            content: '',
            id: makeId(10),
            media: [],
          },
        ]);
      }

      return addGlobalValue(index, [
        {
          delay: 0,
          content: '',
          id: makeId(10),
          media: [],
        },
      ]);
    },
    [current, global, internal]
  );


  const deletePost = useCallback(
    (index: number) => async () => {
      if (
        !(await deleteDialog(
          t(
            'are_you_sure_delete_this_post',
            'Are you sure you want to delete this post?'
          ),
          t('yes_delete_it', 'Yes, delete it!')
        ))
      ) {
        return;
      }

      if (internal) {
        deleteInternalValue(current, index);
        return setLoaded(false);
      }

      deleteGlobalValue(index);
      setLoaded(false);
    },
    [current, global, internal, t]
  );


  if (!loaded || !loadedState) {
    return null;
  }

  return (
    <div
      className={clsx(
        'relative flex-col gap-[20px] flex-1',
        (items.length === 1 || !canEdit || !comments) && 'flex',
        ((!canEdit && !isCreateSet) || !comments) &&
          'bg-newSettings rounded-[12px]'
      )}
    >
      {isCreateSet && current !== 'global' && (
        <>
          <div className="text-center absolute w-full h-full left-0 top-0 items-center justify-center flex z-[101] flex-col gap-6">
            <div>
              <div className="w-[54px] h-[54px] rounded-full absolute z-[101] flex justify-center items-center">
                <LockIcon />
              </div>
              <div className="w-[54px] h-[54px] rounded-full bg-newSettings opacity-80" />
            </div>
            <div className="text-[14px] font-[600] text-white">
              {t(
                'cant_edit_networks_when_creating_set',
                "You can't edit networks when creating a set"
              )}
            </div>
          </div>
          <div className="absolute w-full h-full left-0 top-0 bg-newBackdrop opacity-60 z-[100] rounded-[12px]" />
        </>
      )}
      {!canEdit && !isCreateSet && (
        <>
          <div
            onClick={() => {
              setLoaded(false);
              addRemoveInternal(current);
            }}
            className="text-center absolute w-full h-full p-[20px] left-0 top-0 items-center justify-center flex z-[101] flex-col gap-6"
          >
            <div>
              <div className="w-[54px] h-[54px] rounded-full absolute z-[101] flex justify-center items-center">
                <LockIcon />
              </div>
              <div className="w-[54px] h-[54px] rounded-full bg-newSettings opacity-80" />
            </div>
            <div className="text-[14px] font-[600] text-white">
              {t(
                'click_to_exit_global_editing',
                'Click this button to exit global editing and customize the post for this channel'
              )}
            </div>
            <div>
              <div className="text-white rounded-[8px] h-[44px] px-[20px] bg-[#D82D7E] cursor-pointer flex justify-center items-center">
                {t('edit_content', 'Edit content')}
              </div>
            </div>
          </div>
          <div className="absolute w-full h-full left-0 top-0 bg-newBackdrop opacity-60 z-[100] rounded-[12px]" />
        </>
      )}
      {items.map((g, index) => (
        <div
          key={g.id}
          className={clsx(
            'relative flex flex-col gap-[20px] flex-1 bg-newSettings',
            index === 0 && 'rounded-t-[12px]',
            (index === items.length - 1 || !comments) && 'rounded-b-[12px]',
            !canEdit && !isCreateSet && 'blur-s',
            ((!canEdit && index > 0) || (!comments && index > 0)) && 'hidden'
          )}
        >
          <div className="flex gap-[5px] flex-1 w-full">
            <div className="flex-1 flex w-full">
              {index > 0 && (
                <div className="flex justify-center pl-[12px] text-newSep">
                  <ConnectionLineIcon />
                </div>
              )}
              <Editor
                comments={comments}
                editorType={editor}
                allValues={items}
                onChange={changeValue(index)}
                key={index}
                num={index}
                totalPosts={global.length}
                value={g.content}
                pictures={g.media}
                setImages={changeImages(index)}
                autoComplete={canEdit}
                validateChars={true}
                identifier={internalFromAll?.identifier || 'global'}
                totalChars={totalChars}
                appendImages={appendImages(index)}
                isGlobalPlatform={isGlobalPlatform}
                selectedIntegration={selectedIntegration}
                chars={chars}
                childButton={
                  <>
                    {(canEdit && items.length - 1 === index) || !comments ? (
                      <div className="flex items-center">
                        <div className="flex-1">
                          {comments && (
                            <AddPostButton
                              num={index}
                              onClick={addValue(index)}
                              postComment={postComment}
                            />
                          )}
                        </div>
                        {!!internal && !existingData?.integration && (
                          <div
                            className="mt-[12px] flex gap-[20px] items-center cursor-pointer select-none"
                            onClick={goBackToGlobal}
                          >
                            <div className="flex gap-[6px] items-center">
                              <div className="w-[8px] h-[8px] rounded-full bg-[#FC69FF]" />
                              <div className="text-[14px] font-[600]">
                                {t(
                                  'editing_a_specific_network',
                                  'Editing a Specific Network'
                                )}
                              </div>
                            </div>
                            <div className="flex gap-[6px] items-center">
                              <div>
                                <ResetIcon />
                              </div>
                              <div className="text-[13px] font-[600]">
                                {t('back_to_global', 'Back to global')}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </>
                }
              />
            </div>
            {comments && (
              <div className="flex flex-col items-center gap-[10px] pe-[12px]">
                <UpDownArrow
                  isUp={index !== 0}
                  isDown={index !== items.length - 1}
                  onChange={changeOrder(index)}
                />
                {items.length > 1 && (
                  <TrashIcon
                    onClick={deletePost(index)}
                    data-tooltip-id="tooltip"
                    data-tooltip-content={t(
                      'delete_post_tooltip',
                      'Delete Post'
                    )}
                    className="cursor-pointer text-[#FF3F3F]"
                  />
                )}
                {index > 0 && (
                  <DelayComponent currentIndex={index} currentDelay={g.delay} />
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

export const Editor: FC<{
  editorType?: 'none' | 'normal' | 'markdown' | 'html';
  totalPosts: number;
  value: string;
  num?: number;
  pictures?: any[];
  allValues?: any[];
  onChange: (value: string) => void;
  setImages?: (value: any[]) => void;
  appendImages?: (value: any[]) => void;
  autoComplete?: boolean;
  validateChars?: boolean;
  comments: boolean | 'no-media';
  identifier?: string;
  totalChars?: number;
  selectedIntegration: SelectedIntegrations[];
  isGlobalPlatform: boolean;
  chars: Record<string, number>;
  childButton?: React.ReactNode;
}> = (props) => {
  const {
    editorType = 'normal',
    allValues,
    pictures,
    setImages,
    num,
    identifier,
    appendImages,
    isGlobalPlatform,
    chars,
    childButton,
    comments,
  } = props;
  const [id] = useState(makeId(10));
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const t = useT();
  const toaster = useToaster();
  const editorRef = useRef<undefined | { editor: any }>();
  const [loading, setLoading] = useState(false);
  const [showHooksModal, setShowHooksModal] = useState(false);
  const [generatedHooks, setGeneratedHooks] = useState<string[]>([]);
  const [loadingHooks, setLoadingHooks] = useState(false);
  const [loadingTone, setLoadingTone] = useState(false);
  const [showToneDropdown, setShowToneDropdown] = useState(false);

  const fetch = useFetch();
  const [loadingMagic, setLoadingMagic] = useState(false);

  const handleGenerateHooks = async () => {
    if (!editorRef?.current?.editor) return;
    const text = editorRef.current.editor.getText();
    if (!text || text.length < 5) return toaster.show('Type more text first.', 'warning');
    setLoadingHooks(true);
    try {
      const response = await fetch('/posts/generator/hooks', { method: 'POST', body: JSON.stringify({ content: text }) });
      const data = await response.json();
      if (data?.hooks) { setGeneratedHooks(data.hooks); setShowHooksModal(true); }
    } catch (e) { toaster.show('Failed to generate hooks', 'warning'); }
    setLoadingHooks(false);
  };

  const applyHook = (hook: string) => {
    if (editorRef?.current?.editor) {
      editorRef.current.editor.chain().focus().insertContentAt(0, hook + '\n\n').run();
    }
    setShowHooksModal(false);
  };

  const handleRewriteTone = async (tone: string) => {
    if (!editorRef?.current?.editor) return;
    const text = editorRef.current.editor.getText();
    if (!text || text.length < 5) return toaster.show('Type more text first.', 'warning');
    setLoadingTone(true);
    try {
      const response = await fetch('/posts/generator/tone', { method: 'POST', body: JSON.stringify({ content: text, tone }) });
      const data = await response.json();
      if (data?.rewritten) editorRef.current.editor.commands.setContent(data.rewritten);
    } catch (e) { toaster.show('Failed to rewrite tone', 'warning'); }
    setLoadingTone(false);
    setShowToneDropdown(false);
  };

  const handleAddUtms = () => {
    if (!editorRef?.current?.editor) return;
    const text = editorRef.current.editor.getHTML(); // Use HTML to preserve formatting
    const optimized = appendUtmsToUrls(text);
    editorRef.current.editor.commands.setContent(optimized);
    toaster.show('UTMs added to links', 'success');
  };

  const handleThreadify = () => {
    if (!editorRef?.current?.editor) return;
    const text = editorRef.current.editor.getText();
    const thread = splitIntoThread(text);
    editorRef.current.editor.commands.setContent(thread.join('\n\n---\n\n'));
  };

  const handleMagicTags = async () => {
    const text = editorRef.current.editor.getText();
    if (!text || text.length < 10) {
      toaster.show(t('magic_tags_needs_text', 'Type more text before generating tags.'), 'warning');
      return;
    }

    setLoadingMagic(true);
    try {
      const response = await fetch('/posts/generator/tags', {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      });
      const data = await response.json();
      if (data && data.tags) {
        editorRef.current.editor.chain().focus().insertContent(' ' + data.tags.join(' ')).run();
      }
    } catch (e) {
      toaster.show(t('magic_tags_error', 'Failed to generate tags.'), 'warning');
    }
    setLoadingMagic(false);
  };

  const handleAutoTranslate = async () => {
    if (!editorRef?.current?.editor || loadingMagic) return;
    const text = editorRef.current.editor.getText();
    if (!text || text.length < 5) return;

    setLoadingMagic(true);
    try {
      const response = await fetch('/posts/generator/translate', {
        method: 'POST',
        body: JSON.stringify({ content: text, targetLanguage: 'Spanish' }),
      });
      const data = await response.json();
      if (data && data.translated) {
        editorRef.current.editor.commands.setContent(data.translated);
      }
    } catch (e) {
      toaster.show(t('translate_error', 'Failed to translate.'), 'warning');
    }
    setLoadingMagic(false);
  };


  const uppy = useUppyUploader({
    onUploadSuccess: (result: any) => {
      appendImages(result);
      uppy.clear();
    },
    allowedFileTypes: 'image/*,video/mp4',
    onStart: () => {},
    onEnd: () => setLoading(false),
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const totalSize = acceptedFiles.reduce((acc, file) => acc + file.size, 0);

      if (totalSize > MAX_UPLOAD_SIZE) {
        toaster.show(
          t(
            'upload_size_limit_exceeded',
            'Upload size limit exceeded. Maximum 1 GB per upload session.'
          ),
          'warning'
        );
        return;
      }

      setLoading(true);

      for (const file of acceptedFiles) {
        uppy.addFile(file);
      }
    },
    [uppy, toaster, t]
  );


  const paste = useCallback(
    async (event: ClipboardEvent | File[]) => {
      if (num > 0 && comments === 'no-media') {
        return;
      }
      // @ts-expect-error
      const clipboardItems = event.clipboardData?.items;
      if (!clipboardItems) {
        return;
      }
      const files: File[] = [];

      for (const item of clipboardItems) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }

      const totalSize = files.reduce((acc, file) => acc + file.size, 0);

      if (totalSize > MAX_UPLOAD_SIZE) {
        toaster.show(
          t(
            'upload_size_limit_exceeded',
            'Upload size limit exceeded. Maximum 1 GB per upload session.'
          ),
          'warning'
        );
        return;
      }

      if (files.length > 0) {
        setLoading(true);
      }

      for (const file of files) {
        uppy.addFile(file);
      }
    },
    [uppy, num, comments, toaster, t]
  );


  const { getRootProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      if (loading) {
        toaster.show(
          'Upload current in progress, please wait and then try again.',
          'warning'
        );
        return;
      }
      onDrop(files);
    },
    noDrag: num > 0 && comments === 'no-media',
  });

  const valueWithoutHtml = useMemo(() => {
    return stripHtmlValidation('normal', props.value || '', true);
  }, [props.value]);

  const addText = useCallback(
    (emoji: string) => {
      editorRef?.current?.editor?.commands?.insertContent(emoji);
      editorRef?.current?.editor?.commands?.focus();
    },
    [props.value, id]
  );


  const [loadedEditor, setLoadedEditor] = useState(editorType);
  const [showEditor, setShowEditor] = useState(true);
  useEffect(() => {
    if (editorType === loadedEditor) {
      return;
    }
    setLoadedEditor(editorType);
    setShowEditor(false);
  }, [editorType]);

  useEffect(() => {
    if (showEditor) {
      return;
    }
    setTimeout(() => {
      setShowEditor(true);
    }, 20);
  }, [showEditor]);

  if (!showEditor) {
    return null;
  }

  return (
    <div className="flex flex-col gap-[20px] flex-1">
      <div
        className={clsx(
          'relative flex-1 px-[12px] pt-[12px] pb-[12px] flex flex-col',
          num > 0 && '!rounded-bs-[0]'
        )}
        id={id}
      >
        <div className="relative cursor-text flex flex-1 flex-col">
          <div {...getRootProps()} className="flex flex-1 flex-col">
            <div
              className={clsx(
                'absolute left-0 top-0 w-full h-full bg-black/70 z-[300] transition-all items-center justify-center flex text-white text-sm',
                !isDragActive ? 'pointer-events-none opacity-0' : 'opacity-100'
              )}
            >
              {t('drop_files_here_to_upload', 'Drop your files here to upload')}
            </div>
            <div className="px-6 pt-6 bg-newBgColorInner rounded-t-xl relative z-[99]">
              <OnlyEditor
                value={props.value}
                editorType={editorType}
                onChange={props.onChange}
                paste={paste}
                ref={editorRef}
              />
            </div>
            <div
              className="bg-newBgColorInner flex-1"
              onClick={() => {
                if (editorRef?.current?.editor?.isFocused) {
                  return;
                }
                editorRef?.current?.editor?.commands?.focus('end');
              }}
            />
            <div className="w-full pointer-events-none">
              <div className="w-full h-[46px] overflow-hidden absolute left-0 bg-newBgColorInner uppyChange">
                <Dashboard
                  height={46}
                  uppy={uppy}
                  id={`prog-${num}`}
                  showProgressDetails={true}
                  hideUploadButton={true}
                  hideRetryButton={true}
                  hidePauseResumeButton={true}
                  hideCancelButton={true}
                  hideProgressAfterFinish={true}
                />
              </div>
            </div>
            <div
              className="w-full h-[46px] bg-newBgColorInner cursor-text"
              onClick={() => {
                if (editorRef?.current?.editor?.isFocused) {
                  return;
                }
                editorRef?.current?.editor?.commands?.focus('end');
              }}
            />
            <div className="flex bg-newBgColorInner rounded-b-xl cursor-default">
              {setImages && (
                <MultiMediaComponent
                  mediaNotAvailable={num > 0 && comments === 'no-media'}
                  allData={allValues}
                  text={valueWithoutHtml}
                  label={t('attachments', 'Attachments')}
                  description=""
                  value={props.pictures}
                  isGlobalPlatform={isGlobalPlatform}
                  name="image"
                  information={
                    <InformationComponent
                      isPicture={pictures?.length > 0}
                      chars={chars}
                      totalChars={valueWithoutHtml.length}
                      totalAllowedChars={props.totalChars}
                    />
                  }
                  toolBar={
                    <div className="flex gap-[5px]">
                      <SignatureBox editor={editorRef?.current?.editor} />
                      {editorType !== 'none' && (
                        <>
                          <UText
                            editor={editorRef?.current?.editor}
                            currentValue={props.value!}
                          />
                          <BoldText
                            editor={editorRef?.current?.editor}
                            currentValue={props.value!}
                          />
                        </>
                      )}
                      {(editorType === 'markdown' || editorType === 'html') &&
                        identifier !== 'telegram' && (
                          <>
                            <AComponent
                              editor={editorRef?.current?.editor}
                              currentValue={props.value!}
                            />
                            <Bullets
                              editor={editorRef?.current?.editor}
                              currentValue={props.value!}
                            />
                            <HeadingComponent
                              editor={editorRef?.current?.editor}
                              currentValue={props.value!}
                            />
                          </>
                        )}
                      <div
                        data-tooltip-id="tooltip"
                        data-tooltip-content={t('insert_emoji', 'Insert Emoji')}
                        className="select-none cursor-pointer rounded-[6px] w-[30px] h-[30px] bg-newColColor flex justify-center items-center"
                        onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                      >
                        <EmojiIcon />
                      </div>

                      <button
                        onClick={handleGenerateHooks}
                        className={clsx(
                          'select-none cursor-pointer rounded-[6px] w-[30px] h-[30px] bg-newColColor flex justify-center items-center',
                          loadingHooks && 'animate-pulse'
                        )}
                        title={t('generate_hooks', 'AI Hooks')}
                      >
                        <span className="text-[14px]">🪝</span>
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setShowToneDropdown(!showToneDropdown)}
                          className={clsx(
                            'select-none cursor-pointer rounded-[6px] w-[30px] h-[30px] bg-newColColor flex justify-center items-center',
                            loadingTone && 'animate-pulse'
                          )}
                          title={t('rewrite_tone', 'Tone')}
                        >
                          <span className="text-[14px]">🎭</span>
                        </button>
                        {showToneDropdown && (
                          <div className="absolute top-full mt-1 left-0 bg-white dark:bg-gray-800 border rounded shadow-lg z-50 p-1 w-32">
                            {['Professional 👔', 'Funny 😂', 'Casual 👕', 'Inspirational 🌟'].map(tone => (
                              <div
                                key={tone}
                                onClick={() => handleRewriteTone(tone)}
                                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                              >
                                {tone}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleAddUtms}
                        className="select-none cursor-pointer rounded-[6px] w-[30px] h-[30px] bg-newColColor flex justify-center items-center"
                        title={t('add_utms', 'Add UTMs')}
                      >
                        <span className="text-[14px]">🔗</span>
                      </button>

                      <button
                        onClick={handleThreadify}
                        className="select-none cursor-pointer rounded-[6px] w-[30px] h-[30px] bg-newColColor flex justify-center items-center"
                        title={t('threadify', 'Make Thread')}
                      >
                        <span className="text-[14px]">🧵</span>
                      </button>

                      <button
                        onClick={handleMagicTags}
                        className={clsx(
                          'select-none cursor-pointer rounded-[6px] w-[30px] h-[30px] bg-newColColor flex justify-center items-center',
                          loadingMagic && 'animate-pulse'
                        )}
                        title={t('auto_tags', 'Magic Hashtags')}
                      >
                        <span className="text-[14px]">✨</span>
                      </button>
                      <button
                        onClick={handleAutoTranslate}
                        className={clsx(
                          'select-none cursor-pointer rounded-[6px] w-[30px] h-[30px] bg-newColColor flex justify-center items-center',
                          loadingMagic && 'animate-pulse'
                        )}
                        title={t('auto_translate', 'Translate to Spanish')}
                      >
                        <span className="text-[14px]">🇪🇸</span>
                      </button>
                      <button
                        onClick={() => {
                          if (editorRef?.current?.editor) {
                            editorRef.current.editor.commands.undo();
                          }
                        }}
                        className="select-none cursor-pointer rounded-[6px] w-[30px] h-[30px] bg-newColColor flex justify-center items-center"
                        title={t('undo_revision', 'Undo')}
                      >
                        <span className="text-[14px]">↩️</span>
                      </button>
                      <button
                        onClick={() => {
                          if (editorRef?.current?.editor) {
                            editorRef.current.editor.commands.redo();
                          }
                        }}
                        className="select-none cursor-pointer rounded-[6px] w-[30px] h-[30px] bg-newColColor flex justify-center items-center"
                        title={t('redo_revision', 'Redo')}
                      >
                        <span className="text-[14px]">↪️</span>
                      </button>

                      <div className="relative">
                        <div
                          className={clsx(
                            'absolute z-[500] -start-[50px]',
                            num === 0 && allValues?.length > 1
                              ? 'top-[35px]'
                              : 'bottom-[35px]'
                          )}
                        >
                          <EmojiPicker
                            height={400}
                            theme={
                              (localStorage.getItem('mode') as Theme) ||
                              Theme.DARK
                            }
                            onEmojiClick={(e) => {
                              addText(e.emoji);
                              setEmojiPickerOpen(false);
                            }}
                            open={emojiPickerOpen}
                          />
                        </div>
                      </div>
                    </div>
                  }
                  onChange={(value) => {
                    setImages(value.target.value);
                  }}
                  onOpen={() => {}}
                  onClose={() => {}}
                />
              )}
            </div>
            <div>{childButton}</div>
          </div>
        </div>
      </div>
      {showHooksModal && generatedHooks.length > 0 && (
        <div
          className="fixed inset-0 z-[500] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowHooksModal(false)}
        >
          <div
            className="bg-newBgColorInner border border-newTableBorder rounded-xl p-5 max-w-[520px] w-full flex flex-col gap-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-[600] text-textColor">
                {t('select_a_hook', 'Select a Hook')}
              </h3>
              <button
                type="button"
                onClick={() => setShowHooksModal(false)}
                className="text-sm text-textColor opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
              {generatedHooks.map((hook, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyHook(hook)}
                  className="text-left p-3 rounded-lg border border-newTableBorder hover:bg-boxFocused text-[14px] text-textColor transition-colors"
                >
                  {hook}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

};
export const OnlyEditor = forwardRef<
  any,
  {
    editorType: 'none' | 'normal' | 'markdown' | 'html';
    value: string;
    onChange: (value: string) => void;
    paste?: (event: ClipboardEvent | File[]) => void;
  }
>(({ editorType, value, onChange, paste }, ref) => {
  const t = useT();
  const fetch = useFetch();

  const { internal } = useLaunchStore(
    useShallow((state) => ({
      internal: state.internal.find((p) => p.integration.id === state.current),
    }))
  );


  const loadList = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        return [];
      }

      if (!internal?.integration.id) {
        return [];
      }

      try {
        const load = await fetch('/integrations/mentions', {
          method: 'POST',
          body: JSON.stringify({
            name: 'mention',
            id: internal.integration.id,
            data: { query },
          }),
        });

        const result = await load.json();
        return result;
      } catch (error) {
        console.error('Error loading mentions:', error);
        return [];
      }
    },
    [internal, fetch]
  );


  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Underline,
      Bold,
      InterceptBoldShortcut,
      InterceptUnderlineShortcut,
      BulletList,
      ListItem,
      Placeholder.configure({
        placeholder: t('write_something', 'Write something …'),
        emptyEditorClass: 'is-editor-empty',
      }),
      ...(editorType === 'html' || editorType === 'markdown'
        ? [
            Link.configure({
              openOnClick: false,
              autolink: true,
              defaultProtocol: 'https',
              protocols: ['http', 'https'],
              isAllowedUri: (url, ctx) => {
                try {
                  // prevent transforming plain emails like foo@bar.com into links
                  const trimmed = String(url).trim();
                  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (emailPattern.test(trimmed)) {
                    return false;
                  }

                  // construct URL
                  const parsedUrl = url.includes(':')
                    ? new URL(url)
                    : new URL(`${ctx.defaultProtocol}://${url}`);

                  // use default validation
                  if (!ctx.defaultValidate(parsedUrl.href)) {
                    return false;
                  }

                  // disallowed protocols
                  const disallowedProtocols = ['ftp', 'file', 'mailto'];
                  const protocol = parsedUrl.protocol.replace(':', '');

                  if (disallowedProtocols.includes(protocol)) {
                    return false;
                  }

                  // only allow protocols specified in ctx.protocols
                  const allowedProtocols = ctx.protocols.map((p) =>
                    typeof p === 'string' ? p : p.scheme
                  );

                  if (!allowedProtocols.includes(protocol)) {
                    return false;
                  }

                  // all checks have passed
                  return true;
                } catch {
                  return false;
                }
              },
              shouldAutoLink: (url) => {
                try {
                  const trimmed = String(url).trim();
                  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (emailPattern.test(trimmed)) {
                    return false;
                  }

                  // construct URL
                  const parsedUrl = url.includes(':')
                    ? new URL(url)
                    : new URL(`https://${url}`);

                  // only auto-link if the domain is not in the disallowed list
                  const disallowedDomains = [
                    'example-no-autolink.com',
                    'another-no-autolink.com',
                  ];
                  const domain = parsedUrl.hostname;

                  return !disallowedDomains.includes(domain);
                } catch {
                  return false;
                }
              },
            }),
          ]
        : []),
      ...(internal?.integration?.id
        ? [
            Mention.configure({
              HTMLAttributes: {
                class: 'mention',
              },
              renderHTML({ options, node }) {
                return [
                  'span',
                  mergeAttributes(options.HTMLAttributes, {
                    'data-mention-id': node.attrs.id || '',
                    'data-mention-label': node.attrs.label || '',
                  }),
                  `@${node.attrs.label}`,
                ];
              },
              suggestion: suggestion(loadList),
            }),
          ]
        : []),
      ...(editorType === 'html' || editorType === 'markdown'
        ? [
            Heading.configure({
              levels: [1, 2, 3],
            }),
          ]
        : []),
      History.configure({
        depth: 100, // default is 100
        newGroupDelay: 100, // default is 500ms
      }),
    ],
    content: value || '',
    shouldRerenderOnTransaction: true,
    immediatelyRender: false,
    // @ts-expect-error
    onPaste: paste,
    onUpdate: (innerProps) => {
      onChange?.(innerProps.editor.getHTML());
    },
  });

  useImperativeHandle(ref, () => ({
    editor,
  }));

  return (
    <>
      <EditorContent editor={editor} />

    </>
  );

});
