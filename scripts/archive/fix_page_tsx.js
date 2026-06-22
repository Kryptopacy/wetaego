const fs = require('fs')

let content = fs.readFileSync('app/(dashboard)/dashboard/settings/page.tsx', 'utf8')

// Fix the corrupted block
content = content.replace(
`                <input
                  type="text"
                  name="slug"
                  defaultValue={organization?.slug || ''}
                  required
          </form>`,
`                <input
                  type="text"
                  name="slug"
                  defaultValue={organization?.slug || ''}
                  required
                  pattern="[a-z0-9-]+"
                  className="w-full bg-transparent py-2.5 text-white outline-none"
                  placeholder="my-lounge"
                />
              </div>
              <p className="mt-1 text-xs text-zinc-500">Only lowercase letters, numbers, and hyphens.</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Default Currency</label>
              <CurrencySelector defaultValue={organization?.currency_code || 'NGN'} />
              <p className="mt-1 text-xs text-zinc-500">This currency will be used across your venues and reports.</p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
                Save Changes
              </button>
            </div>
          </form>`
)

fs.writeFileSync('app/(dashboard)/dashboard/settings/page.tsx', content)
console.log('Fixed page.tsx')
