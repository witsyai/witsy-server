
import { test, expect } from 'vitest';
import { _private } from '../../src/llm/controller';
import { Attachment, Message } from 'multi-llm-ts';
import Configuration from '../../src/utils/config';

const messagesPayload = _private.messagesPayload;

const cUnlimited = {
  get chatConversationLength(): number { return 100; },
  get chatMaxAttachments(): number { return 100; }
}

const cLimitAttachments = {
  get chatConversationLength(): number { return 100; },
  get chatMaxAttachments(): number { return 1; }
}

const cLimitBoth = {
  get chatConversationLength(): number { return 2; },
  get chatMaxAttachments(): number { return 1; }
}

const thread0: Message[] = [
];

const thread2 = [
  ...thread0,
  new Message('user', 'prompt1'),
  new Message('assistant', 'reponse1'),
];

const thread4 = [
  ...thread2,
  new Message('user', 'prompt2', new Attachment('image', 'image/png' )),
  new Message('assistant', 'reponse2'),
];
  
const thread6 = [
  ...thread4,
  new Message('user', 'prompt3', new Attachment('text', 'text/plain' )),
  new Message('assistant', 'reponse3'),
];

const thread8 = [
  ...thread6,
  new Message('user', 'prompt4'),
  new Message('assistant', 'reponse4'),
];

test('instructions include date and time', async () => {
  expect(_private.instructions()).toMatch(/date.*time/i);
});

test('build the messages with no limits', async () => {

  let messages = messagesPayload(cUnlimited as Configuration, 'instructions', thread0, false, true);
  expect(JSON.parse(JSON.stringify(messages))).toStrictEqual([
    { role: 'system', content: 'instructions', attachment: null, transient: false },
  ]);

  messages = messagesPayload(cUnlimited as Configuration, 'instructions', thread2, false, true);
  expect(JSON.parse(JSON.stringify(messages))).toStrictEqual([
    { role: 'system', content: 'instructions', attachment: null, transient: false },
    { role: 'user', content: 'prompt1', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse1', attachment: null, transient: false },
  ]);

  messages = messagesPayload(cUnlimited as Configuration, 'instructions', thread4, false, true);
  expect(JSON.parse(JSON.stringify(messages))).toStrictEqual([
    { role: 'system', content: 'instructions', attachment: null, transient: false },
    { role: 'user', content: 'prompt1', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse1', attachment: null, transient: false },
    { role: 'user', content: 'prompt2', attachment: { content: 'image', mimeType: 'image/png' }, transient: false },
    { role: 'assistant', content: 'reponse2', attachment: null, transient: false },
  ]);

  messages = messagesPayload(cUnlimited as Configuration, 'instructions', thread4, false, false);
  expect(JSON.parse(JSON.stringify(messages))).toStrictEqual([
    { role: 'system', content: 'instructions', attachment: null, transient: false },
    { role: 'user', content: 'prompt1', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse1', attachment: null, transient: false },
    { role: 'user', content: 'prompt2', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse2', attachment: null, transient: false },
  ]);

  messages = messagesPayload(cUnlimited as Configuration, 'instructions', thread6, false, true);
  expect(JSON.parse(JSON.stringify(messages))).toStrictEqual([
    { role: 'system', content: 'instructions', attachment: null, transient: false },
    { role: 'user', content: 'prompt1', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse1', attachment: null, transient: false },
    { role: 'user', content: 'prompt2', attachment: { content: 'image', mimeType: 'image/png' }, transient: false },
    { role: 'assistant', content: 'reponse2', attachment: null, transient: false },
    { role: 'user', content: 'prompt3', attachment: { content: 'text', mimeType: 'text/plain' }, transient: false },
    { role: 'assistant', content: 'reponse3', attachment: null, transient: false },
  ]);

  messages = messagesPayload(cUnlimited as Configuration, 'instructions', thread6, true, true);
  expect(JSON.parse(JSON.stringify(messages))).toStrictEqual([
    { role: 'system', content: 'instructions', attachment: null, transient: false },
    { role: 'user', content: 'prompt1', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse1', attachment: null, transient: false },
    { role: 'user', content: 'prompt2', attachment: { content: 'image', mimeType: 'image/png' }, transient: false },
    { role: 'assistant', content: 'reponse2', attachment: null, transient: false },
    { role: 'user', content: 'prompt3', attachment: { content: 'text', mimeType: 'text/plain' }, transient: false },
    { role: 'assistant', content: 'reponse3', attachment: null, transient: false },
  ]);

  messages = messagesPayload(cUnlimited as Configuration, 'instructions', thread6, false, false);
  expect(JSON.parse(JSON.stringify(messages))).toStrictEqual([
    { role: 'system', content: 'instructions', attachment: null, transient: false },
    { role: 'user', content: 'prompt1', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse1', attachment: null, transient: false },
    { role: 'user', content: 'prompt2', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse2', attachment: null, transient: false },
    { role: 'user', content: 'prompt3', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse3', attachment: null, transient: false },
  ]);

});

test('build the messages with limit attachments', async () => {

  let messages = messagesPayload(cLimitAttachments as Configuration, 'instructions', thread6, false, true);
  expect(JSON.parse(JSON.stringify(messages))).toStrictEqual([
    { role: 'system', content: 'instructions', attachment: null, transient: false },
    { role: 'user', content: 'prompt1', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse1', attachment: null, transient: false },
    { role: 'user', content: 'prompt2', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse2', attachment: null, transient: false },
    { role: 'user', content: 'prompt3', attachment: { content: 'text', mimeType: 'text/plain' }, transient: false },
    { role: 'assistant', content: 'reponse3', attachment: null, transient: false },
  ]);

  messages = messagesPayload(cLimitAttachments as Configuration, 'instructions', thread6, true, true);
  expect(JSON.parse(JSON.stringify(messages))).toStrictEqual([
    { role: 'system', content: 'instructions', attachment: null, transient: false },
    { role: 'user', content: 'prompt1', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse1', attachment: null, transient: false },
    { role: 'user', content: 'prompt2', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse2', attachment: null, transient: false },
    { role: 'user', content: 'prompt3', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse3', attachment: null, transient: false },
  ]);

});

test('build the messages with both limits', async () => {

  let messages = messagesPayload(cLimitBoth as Configuration, 'instructions', thread0, false, false);
  expect(JSON.parse(JSON.stringify(messages))).toStrictEqual([
    { role: 'system', content: 'instructions', attachment: null, transient: false },
  ]);

  messages = messagesPayload(cLimitBoth as Configuration, 'instructions', thread2, false, false);
  expect(JSON.parse(JSON.stringify(messages))).toStrictEqual([
    { role: 'system', content: 'instructions', attachment: null, transient: false },
    { role: 'user', content: 'prompt1', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse1', attachment: null, transient: false },
  ]);

  messages = messagesPayload(cLimitBoth as Configuration, 'instructions', thread4, false, false);
  expect(JSON.parse(JSON.stringify(messages))).toStrictEqual([
    { role: 'system', content: 'instructions', attachment: null, transient: false },
    { role: 'user', content: 'prompt1', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse1', attachment: null, transient: false },
    { role: 'user', content: 'prompt2', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse2', attachment: null, transient: false },
  ]);

  messages = messagesPayload(cLimitBoth as Configuration, 'instructions', thread6, false, false);
  expect(JSON.parse(JSON.stringify(messages))).toStrictEqual([
    { role: 'system', content: 'instructions', attachment: null, transient: false },
    { role: 'user', content: 'prompt2', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse2', attachment: null, transient: false },
    { role: 'user', content: 'prompt3', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse3', attachment: null, transient: false },
  ]);

  messages = messagesPayload(cLimitBoth as Configuration, 'instructions', thread8, false, false);
  expect(JSON.parse(JSON.stringify(messages))).toStrictEqual([
    { role: 'system', content: 'instructions', attachment: null, transient: false },
    { role: 'user', content: 'prompt3', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse3', attachment: null, transient: false },
    { role: 'user', content: 'prompt4', attachment: null, transient: false },
    { role: 'assistant', content: 'reponse4', attachment: null, transient: false },
  ]);

});
