import styles from './PageLoader.module.css'

export default function PageLoader({
  title = 'Đang chuẩn bị sân...',
  subtitle = 'Vui lòng chờ trong giây lát.',
}) {
  return (
    <main className={styles.loaderPage} aria-busy="true" aria-live="polite">
      <div className={styles.brandMark}>
        <img src="/images/logo-caulong84.png" alt="Cầu Lông 84" />
        <span>Cầu Lông 84</span>
      </div>

      <section className={styles.loaderContent}>
        <div className={styles.scene} aria-hidden="true">
          <img src="/badminton-loader.svg" alt="Đang tải..." className={styles.svgLoader} />
        </div>

        <div className={styles.copy}>
          <p>Hệ thống quản lý sân</p>
          <h1>{title}</h1>
          <span>{subtitle}</span>
        </div>
      </section>
    </main>
  )
}
