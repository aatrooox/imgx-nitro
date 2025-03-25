interface PropsSchemaItem {
  type: 'size' | 'content' | 'color';
  key: string;
  name: string;
  default: any;
  options?: any[];
  required?: boolean;
  description?: string;
  min?: number;
  max?: number;
  randomColor?: boolean;
  color?: 'adjacent' | 'monochromatic' | 'complementary';
  colorMode?: 'light' | 'dark' | 'pure',
  isMultiple?: boolean,
  separator?: string,
  values?: any[]
}

type PropValue = string | string[] | number;

export function getParsedBgColor(color: string) {
  const colors = color.split('-');
  function getSingleColor(color: string) {
    return color.includes('#') ? color : `#${color}`
  }
  if (colors.length === 1) {
    return {
      bgColor: colors[0].includes(',') ? colors[0] : getSingleColor(colors[0])
    }
  }

  if (colors.length >= 2) {
    return {
      bgImage: `linear-gradient(to right, ${getSingleColor(colors[0])}, ${getSingleColor(colors[1])})`
    }
  }

  return {
    bgColor: `rgba(243,244,212)`
  }
}

/**
 * 将 props 对象转换为 propsSchame 数组
 * @param props 包含 string | string[] | number 类型值的对象
 * @returns propsSchame 数组
 */
export function convertPropsToSchame(props: Record<string, PropValue>): Array<PropsSchemaItem> {
  if (!props || typeof props !== 'object' || Array.isArray(props)) {
    throw createError({
      statusCode: 400,
      message: 'props 必须是一个对象'
    });
  }

  if (Object.keys(props).length === 0) {
    return [];
  }

  const result = [];
  try {

  
  for (const [key, value] of Object.entries(props)) {
    // 判断属性类型
    const type = determineType(value);
    
    const isMultiple = Array.isArray(value)
    // 创建基础配置项
    const schemaItem: PropsSchemaItem = {
      type,
      key,
      name: key, // 默认使用 key 作为名称
      default: isMultiple ? value[0] : value,
      required: false,
      randomColor: false,
      isMultiple,
      values: isMultiple ? value.splice(1) : undefined
    };

    // 根据类型添加额外配置
    if (type !== 'content') {
      // 对于颜色值，可以添加颜色选择器的选项
      if (typeof value === 'string' && (value.startsWith('#') || value.includes('rgb'))) {
        schemaItem.description = '颜色值';
      }
      
      // 对于带有单位的值，可以添加数值范围
      if (typeof value === 'string' && /^\d+(\.\d+)?(px|rem|em|vh|vw|%)$/.test(value)) {
        const numValue = parseFloat(value);
        schemaItem.min = 0;
        schemaItem.max = numValue * 2;
        schemaItem.description = `尺寸，单位: ${value.replace(/[\d.]/g, '')}`;
      }
    }

    
    result.push(schemaItem);
  }
} catch( error) {
  throw createError({
    status: 500,
    message: 'Schema生成错误[convertPropsToSchame]：' + JSON.stringify(error),
  })
}

  return result;
}

/**
 * 判断属性值的类型
 * @param value 属性值
 * @returns 'size' | 'content' | 'color'
 */
function determineType(value: PropValue): 'size' | 'content' | 'color' {
  // 如果是数组，检查第一个元素
  if (Array.isArray(value)) {
    return value.length > 0 ? determineType(value[0]) : 'content';
  }

  // 如果是字符串
  if (typeof value === 'string') {
    // 检查是否是颜色值
    if (value.startsWith('#') && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)) {
      return 'color';
    }
    
    if (value.startsWith('linear-gradient')) {
      return 'color';
    }

    // 检查是否包含 rgb 或 rgba
    if (value.includes('rgb')) {
      return 'color';
    }
    
    // 检查是否带有单位
    if (/^\d+(\.\d+)?(px|rem|em|vh|vw|%|s|ms)$/.test(value)) {
      return 'size';
    }
    
    // 检查是否是纯数字
    if (!isNaN(Number(value))) {
      return 'size';
    }
  }
  
  if (typeof value === 'number') {
    return 'size';
  }
  // 默认为内容类型
  return 'content';
}
