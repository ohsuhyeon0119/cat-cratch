import { useEffect, type RefObject } from 'react'
import { renderStage, getSpriteImageExport } from './spriteRuntime'
import type { SpriteState, Background } from './spriteRuntime'
import s from './StageCanvas.module.css'

interface Props {
  state: SpriteState
  selectedBg: Background
  onBgChange: (bg: Background) => void
  canvasRef: RefObject<HTMLCanvasElement | null>
}

const BG_OPTIONS: { key: Background; label: string }[] = [
  { key: 'sky', label: '하늘' },
  { key: 'night', label: '밤' },
  { key: 'ocean', label: '바다' },
  { key: 'space', label: '우주' },
  { key: 'forest', label: '숲' },
]

export default function StageCanvas({ state, selectedBg, onBgChange, canvasRef }: Props) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    getSpriteImageExport().then((img) => {
      renderStage(canvas, { ...state, bg: selectedBg }, img)
    })
  }, [state, selectedBg, canvasRef])

  return (
    <div className={s.stagePanel}>
      <div className={s.stageControls}>
        <span className={s.stageTitle}>🎬 스테이지</span>
        <div className={s.stageBtns}>
          <button className={s.sBtn} title="전체화면">⛶</button>
          <button className={s.sBtn} title="설정">⚙</button>
        </div>
      </div>

      <div className={s.stageCanvasWrap}>
        <canvas
          ref={canvasRef as RefObject<HTMLCanvasElement>}
          width={480}
          height={360}
          className={s.canvas}
        />
      </div>

      <div className={s.stageCoords}>
        <span className={s.coordChip}>x: {Math.round(state.x)}</span>
        <span className={s.coordChip}>y: {Math.round(state.y)}</span>
      </div>

      <div className={s.spriteSection}>
        <div className={s.spriteSectionHeader}>
          <span className={s.spriteSectionTitle}>🐾 스프라이트</span>
          <button className={s.addSprite} title="스프라이트 추가">+</button>
        </div>
        <div className={s.spriteList}>
          <div className={`${s.spriteThumb} ${s.active}`}>
            <span className={s.sIcon}>🧇</span>
            <span className={s.sName}>와냥이</span>
          </div>
        </div>

        <div className={s.bgSectionHeader}>
          <span className={s.bgSectionTitle}>🖼 배경</span>
        </div>
        <div className={s.bgList}>
          {BG_OPTIONS.map(({ key, label }) => {
            const bgCls = `bg${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof s
            return (
              <div
                key={key}
                className={`${s.bgThumb} ${s[bgCls] ?? ''} ${selectedBg === key ? s.active : ''}`}
                title={label}
                onClick={() => onBgChange(key)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
