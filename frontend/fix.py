import re

with open('src/pages/customer/BookingPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<strong className={styles.confirmSlotValue}><SlotRangeList hours={slots} /></strong>'
end_marker = '<div className={styles.sectionLabel}>Ghi chú</div>'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_part = '''<strong className={styles.confirmSlotValue}><SlotRangeList hours={slots} /></strong>
                      </div>
                      <div className={styles.confirmRow}>
                        <span>🕐 Số giờ × Đơn giá</span>
                        <strong>{slots.length}h × {courtPrice.toLocaleString('vi-VN')}đ</strong>
                      </div>
                      {extras.racket && <div className={styles.confirmRow}><span>🏸 Thuê vợt</span><strong>+30.000đ</strong></div>}
                      {extras.shoes && <div className={styles.confirmRow}><span>👟 Thuê giày</span><strong>+20.000đ</strong></div>}
                    </div>
                  </div>
                </div>

                <div className={styles.divider} />

                {/* Phương thức */}
                <div className={styles.cardSection}>
                  <div className={styles.sectionLabel}>Phương thức thanh toán</div>
                  <div className={styles.payGrid}>
                    {[
                      { k: 'mbbank', icon: '🏦', label: 'MB Bank', sub: 'Chuyển khoản' },
                      { k: 'momo', icon: '🟣', label: 'MoMo', sub: 'Ví điện tử' },
                      { k: 'cash', icon: '💵', label: 'Tiền mặt', sub: 'Tại quầy' },
                    ].map(p => (
                      <button
                        key={p.k}
                        className={`${styles.payBtn} ${method === p.k ? styles.payActive : ''}`}
                        onClick={() => setMethod(p.k)}
                      >
                        <span className={styles.payIcon}>{p.icon}</span>
                        <span>{p.label}</span>
                        <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>{p.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.divider} />

                {/* Ghi chú */}
                <div className={styles.cardSection} style={{ paddingBottom: 28 }}>
                  <div className={styles.sectionLabel}>Ghi chú</div>'''

    new_content = content[:start_idx] + new_part + content[end_idx + len(end_marker):]
    with open('src/pages/customer/BookingPage.jsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Fixed successfully!')
else:
    print('Markers not found!')
