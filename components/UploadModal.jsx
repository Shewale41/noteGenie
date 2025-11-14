'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import UploadForm from './UploadForm'

export default function UploadModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal - Centered on Screen */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4 py-8"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#3a86ff] to-[#3a86ff] px-6 py-4 md:px-8 md:py-6 flex items-center justify-between border-b border-[#3a86ff] rounded-t-3xl">
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  Upload Your Lecture
                </h2>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-[#3a86ff] p-2 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 bg-white">
                <UploadForm onSuccess={onClose} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}