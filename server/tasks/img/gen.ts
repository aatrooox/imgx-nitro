import { log } from 'node:console';
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

export default defineTask({
    meta: {
      name: "img:gen",
      description: "从所有预设中生成预览图片",
    },
    async run({ payload, context }) {
      console.log("正在重新生成预设预览图片...");
      const format = payload.format || 'png';
      const presets = await prisma.preset.findMany({
        include: {
            templateInfo: {
              select: {
                contentKeys: true,
                propsSchema: true,
                template: true
              }
            }
          }
      });
      try {
        const rootDir = process.cwd()
        const presetsDir = resolve(rootDir, 'public/presets')
        console.log('更新预设图片 => ', presetsDir)
        // 确保目录存在
        await mkdir(presetsDir, { recursive: true });
        
        for (const preset of presets) {        
          const response = await $fetch<Blob>(`http://localhost:5777/api/v1/img/${preset.code}?format=${format}`, { responseType: 'blob' })
          const buffer = Buffer.from(await response.arrayBuffer())
          const imagePath = resolve(presetsDir, `${preset.code}.${format}`);
          await writeFile(imagePath, buffer);
        }
      } catch (error) {
        console.error(error);
        return { result: "任务执行失败" };
      }

      return { result: "任务执行完成" };
    },
  });
  