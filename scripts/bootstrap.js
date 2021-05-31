const fs = require('fs')
const path = require('path')
const prettier = require('prettier')
const { components, toPascalCase } = require('./utils')

main()

async function main() {
  const prettierConfig = await prettier.resolveConfig(path.resolve('.prettierrc.js'))

  const index = `
    import '@/themes/common.scss'

    ${
      components.map(component => `import { ${toPascalCase(component)} } from '@/components/${component}'`).join('\n')
    }

    import { config } from '@/common/config/install'
    import { isObject } from '@/common/utils/common'

    import '@/common/icons'

    import type { App } from 'vue'
    import type { InstallOptions } from '@/common/config/install'

    const components = {
      ${components.map(toPascalCase).join(',\n')}
    }

    const install = (
      app: App<unknown>,
      { prefix = '', ...options }: Partial<InstallOptions> & { prefix?: string } = {}
    ) => {
      config.defaults = { ...(options.defaults ?? {}) }
    
      Object.keys(options).forEach(key => {
        if (key !== 'defaults' && isObject(options[key])) {
          config[key] = { ...options[key] }
        }
      })
    
      components.forEach(component => {
        let name = component.name
    
        if (typeof prefix === 'string' && prefix.charAt(0).match(/[a-z]/)) {
          name = name.replace(/([A-Z])/g, '-$1').toLowerCase()
        }
    
        app.component(\`\${prefix}\${name}\`, component)
      })
    }

    export default {
      ...components,
      install
    }
  `

  fs.writeFileSync(
    path.resolve(__dirname, '../components/index.ts'),
    prettier.format(index, { ...prettierConfig, parser: 'typescript' })
  )
}
