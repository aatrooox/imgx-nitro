import { useSafeValidatedQuery, z } from "h3-zod";
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js'
const templateString = `<div class="w-full h-full flex items-center justify-center transition-all duration-300"
    :style="{ backgroundColor: bgColor ?? 'transparent', backgroundImage: bgImage ?? 'linear-gradient(to right, transparent, transparent)', padding: padding, fontFamily: fontFamily }">
    <div :class="[\`text-wrap flex w-full h-full rounded-\${textWrapRounded} shadow-\${textWrapShadow}\`]"
      :style="{ backgroundColor: textWrapBgColor, padding: textWrapPadding }">
      <div class="flex flex-col w-full">
        <template v-for="(line, index) in content">
          <div :class="['font-bold flex', aligns[index]]" :style="{ color: colors[index], fontSize: fontSizes[index] }">
            <template v-for="(text, index) in line" :key="index">
              <span class="flex" v-if="text.type === 'emoji'"
                :style="{ width: iconSizes && iconSizes[index] + 'px', height: iconSizes && iconSizes[index] + 'px', backgroundImage: \`url(\${text.base64URL})\`, backgroundRepeat: 'no-repeat', backgroundSize: '100% 100%' }"></span>
              <span class="text-nowrap" v-else
                :style="{ color: text.type === 'accent' ? (accentColors[index] || '') : '' }">
                {{ text.text }}
              </span>
            </template>
          </div>
        </template>
      </div>
    </div>
  </div>`
const props = {
  content: [[{ text: 'Hello', type: 'text' }], [ { text: 'World', type: 'text' }]],
  bgColor: '',

  colors: ['#000000'],
  accentColors: ['#0088a9'],
  aligns: ['justify-start'],
  fontSizes: ['50px', '20px'],

  fontFamily: 'YouSheBiaoTi',
  padding: '30px',
  bgImage: 'linear-gradient(to right, rgb(213,123,34,11), rgb(156,13,24,31))',
  textWrapBgColor: 'rgba(255,255,255,0.5)',
  textWrapShadow:'lg',
  textWrapPadding: '20px',
  textWrapRounded: 'lg'
}

export default defineEventHandler(async (event) => {
  const YouSheBiaoTi = await useStorage('db').getItemRaw(`SourceHanSerifCN-Regular-1.otf`)
  const vNode = await vueTemplateToSatori(templateString, props)
  // console.log(`vNode`, JSON.stringify(vNode, null, 2) )
  const svg = await satori(
    vNode
    ,
    {
      width: 400,
      height: 600,
      fonts: [
        {
          name: 'YouSheBiaoTi',
          data: YouSheBiaoTi,
          weight: 400,
          style: 'normal',
        }
      ],
    }
  )
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'original',
    },
  })

  const png = resvg.render()

  setHeader(event, 'Content-Type', 'image/png')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, immutable')
  // 生成强验证器
  const etag = `"${Buffer.from(JSON.stringify(getQuery(event))).toString('base64')}"` 
  setHeader(event, 'ETag', etag);
  setHeader(event, 'Last-Modified', new Date().toUTCString());

  // 检查客户端缓存
  const ifNoneMatch = getRequestHeader(event, 'if-none-match')
  if (ifNoneMatch === etag) {
    event.node.res.statusCode = 304
    return null
  }

  return png.asPng()
});
