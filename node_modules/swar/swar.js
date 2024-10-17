/* eslint no-eval: 0 no-new-func: 0 */
/* eslint-env browser */
'use strict'
const vars = {}
const subs = {}
const render = (template, view, value) => {
  const matches = [...template.matchAll(/\{\{(.+?)\}\}/gm)]
  if (typeof (view) !== 'object') {
    view = {}
  }
  for (var key in view) {
    if (Object.prototype.hasOwnProperty.call(view, key)) {
      try {
        this[key] = view[key]
      } catch (e) {
      }
    }
  }
  // eslint-disable-next-line
  const $var = value
  matches.forEach(match => {
    const renderedValue = eval(match[1])
    template = template.replace(match[0], renderedValue)
  })
  return template
}
const css = className => '__swar_' + className
const renderVar = (name, value, element) => {
  const view = vars[name]
  const html = render(element.dataset.template, view, value)
  element.innerHTML = html
  element.hidden = false
}
const renderIf = (name, value, element) => {
  for (var key in vars) {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      this[key] = vars[key]
    }
  }
  const result = eval(element.dataset.if)
  element.hidden = !result
}
const renderFor = (name, value, element) => {
  const parentElement = element.parentElement
  parentElement.querySelectorAll('.' + css('dynamic')).forEach(el => el.remove())
  let sibling
  let $index = 0
  if (!value || typeof value[Symbol.iterator] !== 'function') {
    return null
  }
  for (const $element of value) {
    const view = vars[name]
    view.$element = $element
    view.$index = $index
    const html = render(element.dataset.template, view, value)
    sibling = element.cloneNode()
    Object.keys(sibling.dataset).forEach(dataKey => {
      delete sibling.dataset[dataKey]
    })
    sibling.hidden = false
    sibling.dataset.var = name
    sibling.innerHTML = html
    sibling.classList.add(css('dynamic'))
    sibling.querySelectorAll('[data-onclick]').forEach(el => {
      el.dataset.onclick = el.dataset.onclick.replace('$index', $index)
    })
    parentElement.append(sibling)
    $index++
  }
}

const letVar = (name) => {
  const varName = '$' + name
  if (!window[varName]) {
    const obj = (value) => reactive(name, value)
    obj.fetch = (...params) => fetch.apply(this, params)
      .then(response => response.json())
      .then(data => reactive(name, data))
    obj.push = (...elements) => {
      elements.forEach(element => vars[name]?.push(element))
      reactive(name, vars[name])
      return vars[name].length
    }
    obj.pop = () => {
      const element = vars[name].pop()
      reactive(name, vars[name])
      return element
    }
    obj.splice = (start, deleteCount) => {
      const elements = vars[name].splice(start, deleteCount)
      reactive(name, vars[name])
      return elements
    }
    window[varName] = obj
  }
}

const subscribe = (name, element) => {
  if (typeof subs[name] === 'undefined') {
    subs[name] = []
  }
  subs[name].push(element)
  letVar(name)
}
const reactive = (name, value) => {
  if (typeof value === 'undefined') {
    return vars[name] ?? null
  }
  vars[name] = value
  if (typeof subs[name] === 'undefined') {
    return null
  }
  for (const element of subs[name]) {
    element.dataset.for && renderFor(name, value, element)
    element.dataset.var && renderVar(name, value, element)
    element.dataset.if && renderIf(name, value, element)
  }
  return value
}
document.querySelectorAll('[data-for]').forEach(element => {
  const name = element.dataset.for
  element.dataset.template = element.innerHTML
  element.hidden = true
  subscribe(name, element)
})
document.querySelectorAll('[data-if]').forEach(element => {
  const name = element.dataset.if.match(/[a-z_][a-z0-9_]*/i)[0]
  element.dataset.template = element.innerHTML
  element.hidden = true
  subscribe(name, element)
  reactive(name, null)
})
document.querySelectorAll('[data-var]').forEach(element => {
  const name = element.dataset.var
  element.dataset.template = element.innerHTML
  subscribe(name, element)
  element.hidden = true
})
document.addEventListener('click', event => {
  const element = event.target
  if (element.dataset.onclick) {
    event.preventDefault()
    Function('"use strict";' + element.dataset.onclick).apply(event.target)
  }
}, false)
document.addEventListener('submit', event => {
  const element = event.target
  if (element.dataset.onsubmit) {
    event.preventDefault()
    Function('"use strict";' + element.dataset.onsubmit).apply(event.target)
  }
}, false)
