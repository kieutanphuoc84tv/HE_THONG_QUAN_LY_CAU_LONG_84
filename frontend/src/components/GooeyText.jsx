import * as React from 'react'

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function GooeyText({
  texts,
  morphTime = 1,
  cooldownTime = 0.8,
  className = '',
  textClassName = '',
}) {
  const text1Ref = React.useRef(null)
  const text2Ref = React.useRef(null)
  const filterId = React.useId().replaceAll(':', '')

  React.useEffect(() => {
    if (!texts?.length || !text1Ref.current || !text2Ref.current) return undefined

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let textIndex = texts.length - 1
    let time = performance.now()
    let morph = 0
    let cooldown = cooldownTime
    let frameId = 0

    text1Ref.current.textContent = texts[textIndex]
    text2Ref.current.textContent = texts[0]

    const showStaticText = () => {
      if (!text1Ref.current || !text2Ref.current) return
      text1Ref.current.textContent = texts[0]
      text1Ref.current.style.filter = ''
      text1Ref.current.style.opacity = '1'
      text2Ref.current.textContent = ''
      text2Ref.current.style.filter = ''
      text2Ref.current.style.opacity = '0'
    }

    if (prefersReducedMotion || texts.length === 1) {
      showStaticText()
      return undefined
    }

    const setMorph = (fraction) => {
      if (!text1Ref.current || !text2Ref.current) return

      const nextFraction = Math.max(fraction, 0.001)
      text2Ref.current.style.filter = `blur(${Math.min(8 / nextFraction - 8, 100)}px)`
      text2Ref.current.style.opacity = `${Math.pow(nextFraction, 0.4)}`

      const previousFraction = Math.max(1 - fraction, 0.001)
      text1Ref.current.style.filter = `blur(${Math.min(8 / previousFraction - 8, 100)}px)`
      text1Ref.current.style.opacity = `${Math.pow(previousFraction, 0.4)}`
    }

    const doCooldown = () => {
      morph = 0
      if (!text1Ref.current || !text2Ref.current) return
      text2Ref.current.style.filter = ''
      text2Ref.current.style.opacity = '1'
      text1Ref.current.style.filter = ''
      text1Ref.current.style.opacity = '0'
    }

    const doMorph = () => {
      morph -= cooldown
      cooldown = 0

      let fraction = morph / morphTime
      if (fraction > 1) {
        cooldown = cooldownTime
        fraction = 1
      }

      setMorph(fraction)
    }

    const animate = (now) => {
      frameId = requestAnimationFrame(animate)

      const shouldIncrementIndex = cooldown > 0
      const dt = (now - time) / 1000
      time = now
      cooldown -= dt

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex = (textIndex + 1) % texts.length
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent = texts[textIndex % texts.length]
            text2Ref.current.textContent = texts[(textIndex + 1) % texts.length]
          }
        }
        doMorph()
      } else {
        doCooldown()
      }
    }

    frameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frameId)
  }, [texts, morphTime, cooldownTime])

  return (
    <span className={cx('gooey-text', className)}>
      <svg className="gooey-text__svg" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId}>
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      <span className="gooey-text__layer" style={{ filter: `url(#${filterId})` }}>
        <span ref={text1Ref} className={cx('gooey-text__item', textClassName)} aria-hidden="true" />
        <span ref={text2Ref} className={cx('gooey-text__item', textClassName)} aria-hidden="true" />
      </span>
    </span>
  )
}
