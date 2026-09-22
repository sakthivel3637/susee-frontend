import React, { useState, useEffect, useRef } from "react";
import { Box, IconButton, Dialog, DialogContent } from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  ZoomIn,
} from "lucide-react";
import noImage from "../../assets/img/no-image.jpg";

const MOCK_SLIDES = [{ id: 1, src: noImage, alt: "No Image Available" }];

export default function VehicleImageSlider({ images = [] }) {
  const slides =
    images && images.length > 0
      ? images.map((img, idx) => ({
          id: img.id,
          src: img.fileUrl,
          alt: `Image ${idx + 1}`,
        }))
      : MOCK_SLIDES;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const handleNext = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleThumbnailClick = (index, e) => {
    e?.stopPropagation();
    setActiveIndex(index);
  };

  const handleOpenGallery = () => {
    setIsGalleryOpen(true);
  };

  const handleCloseGallery = () => {
    setIsGalleryOpen(false);
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        zIndex: 2,
        position: "relative",
      }}
    >
      <Box
        onClick={handleOpenGallery}
        sx={{
          width: "100%",
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          cursor: "zoom-in",
          p: 4,
          pb: 12,
          "&:hover .hover-controls": { opacity: 1 },
          minHeight: 0,
        }}
      >
        <Box
          component="img"
          src={slides[activeIndex]?.src}
          alt={slides[activeIndex]?.alt}
          sx={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            transition: "transform 0.3s ease-in-out",
          }}
        />
        <Box
          className="hover-controls"
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(15, 23, 42, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            opacity: 0,
            transition: "opacity 0.2s ease",
            zIndex: 3,
          }}
        >
          {slides.length > 1 ? (
            <IconButton
              onClick={handlePrev}
              sx={{
                bgcolor: "rgba(255,255,255,0.9)",
                "&:hover": { bgcolor: "#ffffff" },
                color: "#0F172A",
              }}
              size="small"
            >
              <ChevronLeft size={18} />
            </IconButton>
          ) : (
            <Box sx={{ width: 26 }} />
          )}

          <Box
            sx={{
              display: "flex",
              gap: 1,
              position: "absolute",
              top: 16,
              right: 16,
            }}
          >
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleOpenGallery();
              }}
              sx={{
                bgcolor: "rgba(255,255,255,0.9)",
                "&:hover": { bgcolor: "#ffffff" },
                color: "#0F172A",
              }}
              size="small"
            >
              <ZoomIn size={14} />
            </IconButton>
          </Box>

          {slides.length > 1 ? (
            <IconButton
              onClick={handleNext}
              sx={{
                bgcolor: "rgba(255,255,255,0.9)",
                "&:hover": { bgcolor: "#ffffff" },
                color: "#0F172A",
              }}
              size="small"
            >
              <ChevronRight size={18} />
            </IconButton>
          ) : (
            <Box sx={{ width: 26 }} />
          )}
        </Box>
      </Box>
      {slides.length > 1 && (
        <Box
          sx={{
            position: "absolute",
            bottom: 24,
            left: 0,
            right: 0,
            display: "flex",
            gap: 1,
            justifyContent: "center",
            zIndex: 4,
          }}
        >
          {slides.map((slide, index) => (
            <Box
              key={slide.id}
              onClick={(e) => handleThumbnailClick(index, e)}
              sx={{
                width: "64px",
                height: "44px",
                borderRadius: 1.5,
                overflow: "hidden",
                cursor: "pointer",
                border: "2px solid",
                borderColor:
                  activeIndex === index ? "#2563EB" : "rgba(255,255,255,0.7)",
                bgcolor: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                transition: "all 0.2s ease",
                opacity: activeIndex === index ? 1 : 0.6,
                "&:hover": { opacity: 1, borderColor: "#2563EB" },
              }}
            >
              <Box
                component="img"
                src={slide.src}
                alt={`Thumb ${index + 1}`}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
          ))}
        </Box>
      )}

      <Dialog
        open={isGalleryOpen}
        onClose={handleCloseGallery}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "rgba(15, 23, 42, 0.95)",
            boxShadow: "none",
            overflow: "hidden",
            borderRadius: 4,
          },
        }}
      >
        <DialogContent
          sx={{
            position: "relative",
            p: 0,
            height: { xs: "60vh", md: "80vh" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconButton
            onClick={handleCloseGallery}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "#FFFFFF",
              bgcolor: "rgba(255,255,255,0.1)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
              zIndex: 10,
            }}
          >
            <X size={20} />
          </IconButton>

          {slides.length > 1 && (
            <IconButton
              onClick={handlePrev}
              sx={{
                position: "absolute",
                left: 16,
                color: "#FFFFFF",
                bgcolor: "rgba(255,255,255,0.1)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                zIndex: 10,
              }}
            >
              <ChevronLeft size={28} />
            </IconButton>
          )}

          <Box
            component="img"
            src={slides[activeIndex]?.src}
            alt={slides[activeIndex]?.alt}
            sx={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
              userSelect: "none",
              filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))",
            }}
          />

          {slides.length > 1 && (
            <IconButton
              onClick={handleNext}
              sx={{
                position: "absolute",
                right: 16,
                color: "#FFFFFF",
                bgcolor: "rgba(255,255,255,0.1)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                zIndex: 10,
              }}
            >
              <ChevronRight size={28} />
            </IconButton>
          )}
          {slides.length > 1 && (
            <Box
              sx={{
                position: "absolute",
                bottom: 20,
                display: "flex",
                gap: 1.5,
                zIndex: 10,
              }}
            >
              {slides.map((slide, index) => (
                <Box
                  key={slide.id}
                  onClick={(e) => handleThumbnailClick(index, e)}
                  sx={{
                    width: "54px",
                    height: "36px",
                    borderRadius: 1,
                    overflow: "hidden",
                    cursor: "pointer",
                    border: "2px solid",
                    borderColor:
                      activeIndex === index
                        ? "#FFFFFF"
                        : "rgba(255,255,255,0.3)",
                    opacity: activeIndex === index ? 1 : 0.5,
                    transition: "all 0.2s ease",
                    "&:hover": { opacity: 0.8 },
                  }}
                >
                  <img
                    src={slide.src}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
