import { validateTemplate, type Template, type TextField } from '../lib/model';
const text = (
  id: string,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  extra: Partial<TextField> = {},
): TextField => ({
  id,
  kind: 'text',
  label,
  x,
  y,
  width,
  height,
  fontSize: 44,
  minFontSize: 20,
  direction: 'horizontal',
  color: '#30253e',
  align: 'left',
  font: 'sans',
  multiline: false,
  ...extra,
});
export const templates: Template[] = [
  {
    id: 'midnight-note',
    version: 1,
    title: 'Midnight note',
    width: 1200,
    height: 1600,
    background: '/templates/midnight-note.svg',
    author: {
      id: 'operator',
      name: 'ずとまよプロフィールメーカー 運営',
      avatar: '/templates/avatar.svg',
      url: 'https://github.com/hashiserver/ztmy-profile-maker',
    },
    icon: { x: 100, y: 240, size: 240 },
    shareText: '自己紹介カードを作りました。 #ずとまよ好きと繋がりたい',
    fields: [
      text('name', '名前', 390, 285, 690, 78),
      text('song', '好きな曲', 120, 600, 960, 145, { multiline: true }),
      text('memory', '好きなところ・思い出', 120, 850, 780, 260, {
        fontSize: 36,
        multiline: true,
      }),
      text('message', 'ひとこと', 990, 850, 90, 310, {
        direction: 'vertical',
        fontSize: 34,
      }),
      {
        id: 'style',
        kind: 'choice',
        label: '楽しみ方',
        multiple: true,
        options: [
          { id: 'listen', label: '聴く', x: 145, y: 1258 },
          { id: 'live', label: 'ライブ', x: 445, y: 1258 },
          { id: 'create', label: 'つくる', x: 790, y: 1258 },
        ],
      },
    ],
  },
];
templates.forEach(validateTemplate);
