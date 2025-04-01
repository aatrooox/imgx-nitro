// import emojiIcons from '@@/assets/icons/twemoji-face-icons.json'
import { getIconData, iconToSVG, iconToHTML, replaceIDs } from '@iconify/utils';
import listGet from '~/api/v1/template/list.get';

interface IconData {
  body: string;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  // 可能还有其他属性，根据实际数据结构添加
}

interface IconSet {
  prefix: string;
  icons: {
    [key: string]: IconData;
  };

  // 可能还有其他属性，如 width, height, 等
  width?: number;
  height?: number;
  // 其他可能的属性
}

type IconName = string
// type SupportedSetName = 'twemoji'
// const supportedIcons = {
//   'twemoji': emojiIcons,
// }
/**
 * 返回在 backgroundImage 中使用的url内容
 * @param iconName twemoji:downcast-face-with-sweat
 * @returns base64 url 
 */
export async function getBase64IconURL(iconName:string, iconSize: number) {
  const svgHTML = await getIconSVGHTML(iconName, iconSize);
  // console.log(`svgHTML`, svgHTML)
  if (!svgHTML) return null;
   
  const base64SVG = `data:image/svg+xml;base64,${btoa(svgHTML)}`;

  return base64SVG
}

export async function getIconSVGHTML(iconName:IconName, iconSize: number) { 
  // const emojiIcons = await useStorage('assets:server').getItem(`twemoji-face-icons.json`)
  // const typedEmojiIcons = emojiIcons as IconSet;
  // if (!iconName) return null;
  // const iconNames = iconName.split(':');

  // if (iconNames.length !== 2) return null;

  // const iconInnerName = iconNames[1];

  // const iconData = getIconData(typedEmojiIcons as any, iconInnerName);

  const [prefix, iconInnerName] = iconName.split(':');

  if (!prefix || !iconInnerName) return null;

  const resData = await $fetch<any>(`https://icon.zzao.club/${prefix}.json?icons=${iconInnerName}&width=${iconSize}&height=${iconSize}`);
  const iconData = resData.icons[iconInnerName];

  if (!iconData) return null;

  const sizes = {
    width: iconData.width ?? resData.width ?? 50,
    height: iconData.height ?? resData.height ?? 50
  }
  const renderData = iconToSVG({ ...iconData, ...sizes }, sizes);

  let iconSVG = iconToHTML(renderData.body, renderData.attributes);
  // 修正 viewBox 属性，确保与 iconSize 一致
  // iconSVG = iconSVG.replace(/viewbox="([^"]*)"/, `viewbox="0 0 ${iconSize} ${iconSize}"`);
  return iconSVG;
}