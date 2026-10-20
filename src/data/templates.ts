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
    id: 'ztmy-heijokyo-2026',
    version: 1,
    title: 'ずとまよ自己紹介カード',
    description:
      '名前・好きな曲・ライブ参戦歴・思い出をまとめる自己紹介カードです。',
    badge: '許諾申請用プレビュー',
    width: 1537,
    height: 2048,
    background: '/templates/ztmy-heijokyo-2026.jpg',
    author: {
      id: 'provided-author-pending',
      name: '作者情報確認中',
      avatar: '/templates/author-pending.svg',
      url: '/about/#template-permission',
    },
    icon: { x: 683, y: 313, size: 332 },
    shareText: '自己紹介カードを作りました。 #ずとまよ好きと繋がりたい',
    fields: [
      text('name', '名前', 126, 327, 480, 60, {
        fontSize: 42,
        color: '#315323',
      }),
      text('song', '好きなずとまよの曲', 128, 779, 580, 130, {
        fontSize: 38,
        color: '#315323',
        multiline: true,
      }),
      text('live-history', 'ライブ参戦歴', 338, 1030, 740, 130, {
        fontSize: 36,
        color: '#315323',
        multiline: true,
      }),
      text('memory', 'ずとまよの思い出', 150, 1290, 830, 130, {
        fontSize: 36,
        color: '#315323',
        multiline: true,
      }),
      text('free-space', 'フリースペース', 150, 1580, 1290, 340, {
        fontSize: 36,
        color: '#315323',
        multiline: true,
      }),
      {
        id: 'age',
        kind: 'choice',
        label: '年齢',
        multiple: false,
        mark: 'circle',
        radius: 42,
        options: [
          { id: '20-plus', label: '20歳以上', x: 173, y: 530 },
          { id: '19-under', label: '19歳以下', x: 289, y: 530 },
        ],
      },
      {
        id: 'gender',
        kind: 'choice',
        label: '性別',
        multiple: false,
        mark: 'circle',
        radius: 26,
        options: [
          { id: 'male', label: '男性', x: 408, y: 531 },
          { id: 'female', label: '女性', x: 496, y: 531 },
          { id: 'other', label: 'その他・非公開', x: 578, y: 531 },
        ],
      },
      {
        id: 'live-days',
        kind: 'choice',
        label: 'ライブ参加日',
        multiple: true,
        options: [
          { id: 'day1', label: 'Day1 10/10', x: 1427, y: 544 },
          { id: 'day2', label: 'Day2 10/11', x: 1427, y: 626 },
        ],
      },
    ],
  },
  {
    id: 'midnight-note',
    version: 1,
    title: 'Midnight note',
    width: 1200,
    height: 1600,
    background: '/templates/midnight-note.svg',
    author: {
      id: 'operator',
      name: 'ztmy profile maker 運営',
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
