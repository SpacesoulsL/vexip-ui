import { isObject } from './common'

export function transformListToMap<T = any>(list: T[], prop: string): Record<string, T> {
  const map = {} as Record<string, any>

  if (!prop) return map

  list.forEach(item => {
    if (prop in item) {
      map[`${item[prop as keyof typeof item]}`] = item
    }
  })

  return map
}

/**
 * 移除数组中的某个元素
 * @param array - 需要被移除元素的数组
 * @param item - 需要被移除的元素, 或一个查找方法，如果元素为函数时则需要做一层简单包装
 * @param isFn - 标记数组的元素是否为函数
 */
export function removeArrayItem<T = any>(
  array: T[],
  item: T | ((item: T) => boolean),
  isFn = false
): T | null {
  let index = -1

  if (isFn || typeof item !== 'function') {
    index = array.findIndex(current => current === item)
  } else {
    index = array.findIndex(item as (item: T) => boolean)
  }

  if (~index) {
    return array.splice(index, 1)[0]
  }

  return null
}

/**
 * 按照一定顺序的属性对数据进行分组
 * @param list - 需要分数的数据
 * @param props - 需要按顺序分组的属性
 */
export function groupByProps<T = any>(
  list: T[],
  props: Array<string | ((item: T) => any)> | string | ((item: T) => any) = []
): Record<string, T[]> {
  if (typeof props === 'string' || typeof props === 'function') {
    props = [props]
  }

  const propCount = props.length
  const zipData: Record<string, any> = {}

  for (const item of list) {
    let data

    for (let i = 0; i < propCount; i++) {
      const isLast = i === propCount - 1
      const prop = props[i]
      const value = typeof prop === 'function' ? prop(item) : item[prop as keyof T]

      if (!data) {
        if (!zipData[value]) {
          zipData[value] = isLast ? [] : {}
        }

        data = zipData[value]
      } else {
        if (!data[value]) {
          data[value] = isLast ? [] : {}
        }

        data = data[value]
      }
    }

    data.push(item)
  }

  return zipData
}

export interface TreeOptions {
  keyField?: string,
  childField?: string,
  parentField?: string
}

/**
 * 转换扁平结构为树形结构
 * @param list - 需要转换的扁平数据
 * @param options - 转化配置项
 */
export function transformTree<T extends Record<string, unknown>>(
  list: T[],
  options: TreeOptions = {}
) {
  const { keyField = 'id', childField = 'children', parentField = 'parent' } = options

  const tree: T[] = []
  const record = new Map<string | number, T[]>()

  for (let i = 0, len = list.length; i < len; i++) {
    const item = list[i]
    const id = item[keyField] as string | number

    if (!id) {
      continue
    }

    if (record.has(id)) {
      (item as any)[childField] = record.get(id)!
    } else {
      (item as any)[childField] = []
      record.set(id, (item as any)[childField])
    }

    if (item[parentField]) {
      const parentId = item[parentField] as string | number

      if (!record.has(parentId)) {
        record.set(parentId, [])
      }

      record.get(parentId)!.push(item)
    } else {
      tree.push(item)
    }
  }

  return tree
}

/**
 * 转换树形结构为扁平结构
 * @param tree - 需要转换的树形数据
 * @param options - 转化配置项
 */
export function flatTree<T extends Record<string, unknown>>(tree: T[], options: TreeOptions = {}) {
  const { keyField = 'id', childField = 'children', parentField = 'parent' } = options

  const list: T[] = []
  const loop = [...tree]

  let idCount = 1

  while (loop.length) {
    const item = loop.shift()!

    let id
    let children: any[] = []

    if ((item[childField] as any[])?.length) {
      children = item[childField] as any[]
    }

    if (item[keyField]) {
      id = item[keyField]
    } else {
      id = idCount++
    }

    if (!item[parentField]) {
      (item as any)[parentField] = null
    }

    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i]

      child[parentField] = id
      loop.push(child)
    }

    list.push(item)
  }

  return list
}

export interface SortOptions {
  key: string,
  method?: (prev: any, next: any) => number,
  accessor?: (...args: any[]) => any,
  type?: string,
  params?: any[] // 传入读取器的额外参数
}

/**
 * 根据依赖的属性逐层排序
 * @param list - 需要排序的数组
 * @param props - 排序依赖的属性 key-属性名 method-排序方法 accessor-数据获取方法 type-升降序
 */
export function sortByProps(
  list: any[],
  props: string | SortOptions | (string | SortOptions)[]
): any[] {
  if (
    !list.sort ||
    (isObject<SortOptions>(props) && !props.key) ||
    !(props as string | SortOptions[]).length
  ) {
    return list
  }

  const sortedList = Array.from(list)
  const defaultSortMethod = (prev: any, next: any) => {
    if (Number.isNaN(Number(prev) - Number(next))) {
      return String(prev).localeCompare(next)
    }

    return prev - next
  }

  if (!Array.isArray(props)) {
    props = [props]
  }

  const formattedProps = props
    .map(value =>
      typeof value === 'string'
        ? {
            key: value,
            method: defaultSortMethod,
            type: 'asc'
          }
        : value
    )
    .map(value => {
      if (typeof value.accessor !== 'function') {
        value.accessor = (data: Record<string, any>) => data[value.key]
      }

      if (typeof value.method !== 'function') {
        value.method = defaultSortMethod
      }

      value.params = Array.isArray(value.params) ? value.params : []

      return value as Required<SortOptions>
    })

  sortedList.sort((prev, next) => {
    const results: number[] = []

    for (const prop of formattedProps) {
      const { method, type, accessor, params } = prop
      const desc = type === 'desc'
      const result = method(accessor(prev, ...params), accessor(next, ...params))

      results.push(desc ? -result : result)
      // 若不为0则无需进行下一层排序
      if (result) break
    }

    return results.pop() ?? 0
  })

  return sortedList
}