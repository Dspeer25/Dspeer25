import { motion } from 'framer-motion'

// Unsplash-hosted animal photos (free to use)
const ANIMAL_IMAGES = {
  cow: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=600&h=400&fit=crop&crop=faces',
  chicken: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&h=400&fit=crop&crop=faces',
  pig: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&h=400&fit=crop&crop=faces',
}

export default function AnimalReveal({ animalType, count, label }) {
  const imageUrl = ANIMAL_IMAGES[animalType] || ANIMAL_IMAGES.chicken
  const percentage = Math.min(count * 100, 100)
  const displayPercent = percentage < 1 ? percentage.toFixed(1) : Math.round(percentage)

  return (
    <motion.div
      className="animal-card glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="animal-image-container">
        {/* Grayscale background layer */}
        <img
          src={imageUrl}
          alt=""
          className="animal-image-gray"
          loading="lazy"
        />
        {/* Color reveal layer - clips from bottom */}
        <motion.div
          style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
          initial={{ clipPath: 'inset(100% 0 0 0)' }}
          animate={{ clipPath: `inset(${100 - percentage}% 0 0 0)` }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
        >
          <img
            src={imageUrl}
            alt={label}
            className="animal-image-color"
            loading="lazy"
          />
        </motion.div>

        {/* Overlay with text */}
        <div className="animal-overlay">
          <motion.div
            className="animal-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <span className="animal-badge-text">{displayPercent}% of a {label}</span>
          </motion.div>
          <motion.p
            className="animal-saved-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            You just saved this.
          </motion.p>
          <motion.p
            className="animal-saved-sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            ~{count.toFixed(3)} {label}{count !== 1 ? 's' : ''} spared from this meal
          </motion.p>
        </div>
      </div>
    </motion.div>
  )
}
