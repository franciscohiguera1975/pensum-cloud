import { Injectable, NotFoundException } from '@nestjs/common';
// pdfkit uses module.exports = PDFDocument (CommonJS), so use import= to avoid .default wrapping
import PDFDocument = require('pdfkit');
import { PrismaService } from '@shared/infrastructure/database/prisma.service';

// ── Semester color palette ─────────────────────────────────────────────────────
const SEM_COLORS = [
  '#BE2F00', // S1 red-orange
  '#38DA54', // S2 green
  '#AF8103', // S3 gold
  '#4057C8', // S4 blue
  '#B503D9', // S5 purple
  '#00A6D1', // S6 teal
  '#1A8C38', // S7 forest green
  '#0D2DAD', // S8 navy
];

const DARK_PURPLE = '#440054';
const CREAM       = '#E9C99E';
const SECONDARY   = '#9C7972';
const CARD_BORDER = '#D9B899';
const LIGHT_BG    = '#F9F6F3';
const FOOTER_BG   = '#F0EDE8';
const DESC_COLOR  = '#555555';

// ── Layout constants ───────────────────────────────────────────────────────────
const LEFT        = 155;   // left sidebar width
const RIGHT_W     = 215;   // right sidebar width
const COL_W       = 163;   // semester column width
const COL_GAP     = 7;     // gap between columns
const HEADER_H    = 88;    // top header + career bar height
const CAT_BAND_H  = 13;    // category band height
const SEM_AREA_H  = 64;    // circle + name (increased from 56 for more breathing room)
const HDR_H       = 32;    // colored header inside card (increased for larger font)
const BOT_H       = 56;    // service + practicas bars
const FOOTER_LINE = 20;    // dark footer

// Card heights
const CARD_H_FULL    = 150;  // with description bullets
const CARD_H_COMPACT = 62;   // without description (just header + code/credits + footer)
const CARD_GAP       = 10;

@Injectable()
export class MallaPdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(
    curriculumId: string,
    tenantId: string,
    includeContent = true,
  ): Promise<Buffer> {
    // ── Load data ────────────────────────────────────────────────────────────
    const curriculum = await this.prisma.curriculum.findFirst({
      where: { id: curriculumId, tenantId, deletedAt: null },
      include: {
        career: { include: { faculty: { include: { university: true } } } },
        semesters: {
          where: { deletedAt: null },
          orderBy: { number: 'asc' },
          include: {
            subjects: {
              where: { deletedAt: null },
              orderBy: { code: 'asc' },
            },
          },
        },
      },
    });

    if (!curriculum) throw new NotFoundException('Curriculum not found');

    const CARD_H     = includeContent ? CARD_H_FULL : CARD_H_COMPACT;
    const nSems      = curriculum.semesters.length;
    const maxSubs    = Math.max(...curriculum.semesters.map(s => s.subjects.length), 0);
    const gridH      = maxSubs * (CARD_H + CARD_GAP) - CARD_GAP;
    const PAGE_H     = HEADER_H + CAT_BAND_H + SEM_AREA_H + gridH + BOT_H + FOOTER_LINE + 16;
    const contentW   = nSems * (COL_W + COL_GAP) - COL_GAP;
    const PAGE_W     = LEFT + contentW + RIGHT_W;

    const uniName    = curriculum.career.faculty.university.name;
    const facName    = curriculum.career.faculty.name;
    const carName    = curriculum.career.name.toUpperCase();
    const totalCreds = curriculum.semesters.reduce((a, s) =>
      a + s.subjects.reduce((b, su) => b + su.credits, 0), 0);
    const totalCC    = curriculum.semesters.reduce((a, s) =>
      a + s.subjects.reduce((b, su) => b + su.hoursTheory + su.hoursPractice, 0), 0);
    const totalAuto  = curriculum.semesters.reduce((a, s) =>
      a + s.subjects.reduce((b, su) => b + su.credits * 32, 0), 0);
    const totalServ  = 300; // 60 serv.com + 240 práct.lab.

    // ── PDF ──────────────────────────────────────────────────────────────────
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: [PAGE_W, PAGE_H], margin: 0 });
      doc.on('data', c => chunks.push(c as Buffer));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Helpers ───────────────────────────────────────────────────────────
      const fillRect = (x: number, y: number, w: number, h: number, color: string) =>
        doc.rect(x, y, w, h).fill(color);

      const txt = (
        text: string, x: number, y: number, w: number,
        size: number, color: string,
        opts: { bold?: boolean; align?: 'left' | 'center' | 'right'; lineBreak?: boolean } = {}
      ) => {
        doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
           .fontSize(size)
           .fillColor(color)
           .text(text, x, y, { width: w, align: opts.align ?? 'left', lineBreak: opts.lineBreak ?? false });
      };

      // ── Background ────────────────────────────────────────────────────────
      fillRect(0, 0, PAGE_W, PAGE_H, LIGHT_BG);
      fillRect(LEFT, HEADER_H, contentW, PAGE_H - HEADER_H - FOOTER_LINE, '#FFFFFF');

      // ── Top header bar ────────────────────────────────────────────────────
      fillRect(0, 0, PAGE_W, 34, DARK_PURPLE);

      // Center: MALLA CURRICULAR / career
      txt('MALLA CURRICULAR', 0, 7, PAGE_W, 13, '#FFFFFF', { bold: true, align: 'center' });
      txt(carName, 0, 22, PAGE_W, 8, CREAM, { align: 'center' });

      // Left: UTE info
      txt(uniName.toUpperCase(), 10, 7,  170, 7, '#FFFFFF', { bold: true });
      txt(facName,               10, 17, 170, 6, CREAM);
      txt('www.ute.edu.ec',      10, 26, 170, 6, CREAM);

      // Right: version + modality
      txt(`Versión ${curriculum.version}`,     PAGE_W - 185, 7,  180, 7, '#FFFFFF', { align: 'right' });
      txt('RES. APROBACIÓN: RPC-SO-2025',      PAGE_W - 185, 17, 180, 5.5, CREAM, { align: 'right' });
      txt('Modalidad: Presencial',             PAGE_W - 185, 26, 180, 5.5, CREAM, { align: 'right' });

      // ── Career name bar ───────────────────────────────────────────────────
      fillRect(0, 34, LEFT, HEADER_H - 34, DARK_PURPLE);

      txt(carName,                                                LEFT + 4, 38, contentW - 8, 17, DARK_PURPLE, { bold: true });
      txt(`CARRERA DE ${carName} · ${facName.toUpperCase()}`,    LEFT + 4, 59, contentW - 8, 6.5, SECONDARY);
      txt(
        `MODALIDAD PRESENCIAL  ·  RESOLUCIÓN: RPC-SO-2025  ·  CARGA TOTAL: ${totalCreds} CRÉDITOS`,
        LEFT + 4, 70, contentW - 8, 6.5, SECONDARY
      );

      // ── Category bands (horizontal, above semester circles) ──────────────
      const catDefs = [
        { name: 'BÁSICA',               end: Math.round(nSems * 0.25), bg: '#EDE8E4' },
        { name: 'PROFESIONAL',           end: Math.round(nSems * 0.75), bg: '#E4E0EC' },
        { name: 'INTEGRACIÓN CURRICULAR', end: nSems,                   bg: '#E0EAE4' },
      ];
      let catStart = 0;
      for (const cat of catDefs) {
        const cx = LEFT + catStart * (COL_W + COL_GAP);
        const cw = (cat.end - catStart) * (COL_W + COL_GAP) - COL_GAP;
        fillRect(cx, HEADER_H, cw, CAT_BAND_H, cat.bg);
        txt(cat.name, cx, HEADER_H + 3.5, cw, 6, SECONDARY, { bold: true, align: 'center' });
        catStart = cat.end;
      }

      // ── Left sidebar — vertical category labels ───────────────────────────
      const sidebarTop = HEADER_H + CAT_BAND_H + SEM_AREA_H;
      const catH3   = gridH / 3;

      const leftCats = [
        { label: 'BÁSICA',                color: SEM_COLORS[0] },
        { label: 'PROFESIONAL',            color: SEM_COLORS[1] },
        { label: 'INTEGRACIÓN CURRICULAR', color: SEM_COLORS[4] },
      ];

      for (let i = 0; i < leftCats.length; i++) {
        const barY = sidebarTop + i * catH3;
        fillRect(0, barY, 7, catH3 - 2, leftCats[i].color);

        doc.save();
        doc.translate(28, barY + catH3 / 2);
        doc.rotate(-90);
        doc.font('Helvetica-Bold').fontSize(7).fillColor(SECONDARY)
           .text(leftCats[i].label, -45, -4, { width: 90, align: 'center', lineBreak: false });
        doc.restore();
      }

      // ── Semester columns ──────────────────────────────────────────────────
      const gridTop = HEADER_H + CAT_BAND_H + SEM_AREA_H;

      for (let i = 0; i < nSems; i++) {
        const sem   = curriculum.semesters[i];
        const color = SEM_COLORS[i % SEM_COLORS.length];
        const cx    = LEFT + i * (COL_W + COL_GAP);

        // Semester circle — center sits in the middle of SEM_AREA_H
        const circleY = HEADER_H + CAT_BAND_H + SEM_AREA_H / 2;
        doc.circle(cx + COL_W / 2, circleY, 22).fill(color);
        doc.circle(cx + COL_W / 2, circleY, 18).fill('#FFFFFF');
        doc.circle(cx + COL_W / 2, circleY, 14).fill(color);

        // Number centered in inner circle
        const numStr = String(sem.number);
        const numSize = 14;
        doc.font('Helvetica-Bold').fontSize(numSize).fillColor('#FFFFFF')
           .text(numStr, cx, circleY - numSize * 0.38, {
             width: COL_W, align: 'center', lineBreak: false,
           });

        // Semester name below circle (stays within SEM_AREA_H)
        const semLabel = sem.name ?? `Semestre ${sem.number}`;
        const label30  = semLabel.length > 28 ? semLabel.slice(0, 28) + '…' : semLabel;
        txt(label30, cx, circleY + 18, COL_W, 6.5, SECONDARY, { align: 'center' });

        // Subject cards
        sem.subjects.forEach((sub, j) => {
          const cardY = gridTop + j * (CARD_H + CARD_GAP);
          const cc    = sub.hoursTheory + sub.hoursPractice;
          const th    = cc + sub.credits * 32;

          // Card background + border
          doc.rect(cx, cardY, COL_W, CARD_H).fill('#FFFFFF').stroke(CARD_BORDER);

          // Colored header bar
          fillRect(cx, cardY, COL_W, HDR_H, color);

          // Subject name in header — up to 2 lines, 8pt Bold
          doc.font('Helvetica-Bold').fontSize(8).fillColor(CREAM)
             .text(sub.name, cx + 4, cardY + 5, {
               width: COL_W - 8, align: 'center',
               height: HDR_H - 8, lineBreak: true, ellipsis: true,
             });

          // Code (left) + Credits badge (right)
          const codeY = cardY + HDR_H + 6;
          txt(sub.code,             cx + 5,          codeY, 70,  7,   SECONDARY);
          txt(`${sub.credits} CR`,  cx + COL_W - 40, codeY, 36,  8,   DARK_PURPLE, { bold: true, align: 'right' });

          if (includeContent) {
            // Separator line
            const sepY = codeY + 13;
            doc.moveTo(cx + 4, sepY).lineTo(cx + COL_W - 4, sepY).stroke(CARD_BORDER);

            // Description modules (4 bullets from semicolons)
            const modules = (sub.description ?? '')
              .split(';')
              .map(m => m.trim())
              .filter(Boolean)
              .slice(0, 4);

            const descStartY = sepY + 4;
            const descLineH  = (CARD_H - (sepY - cardY) - 4 - 14) / 4; // distribute evenly
            const descMaxW   = COL_W - 14;

            modules.forEach((mod, mi) => {
              const lineY = descStartY + mi * descLineH;
              doc.font('Helvetica-Bold').fontSize(6).fillColor(DESC_COLOR)
                 .text('•', cx + 4, lineY, { width: 7, lineBreak: false });
              doc.font('Helvetica').fontSize(6).fillColor(DESC_COLOR)
                 .text(mod, cx + 12, lineY, {
                   width: descMaxW, lineBreak: false, ellipsis: true,
                 });
            });
          }

          // Hours footer
          const footY = cardY + CARD_H - 14;
          fillRect(cx, footY, COL_W, 14, FOOTER_BG);
          doc.font('Helvetica').fontSize(6.5).fillColor(SECONDARY)
             .text(`CC: ${cc}h  ·  TH: ${th}h`, cx, footY + 4, {
               width: COL_W, align: 'center', lineBreak: false,
             });
        });
      }

      // ── Bottom spanning bars ──────────────────────────────────────────────
      const barsTop = gridTop + gridH + 10;
      fillRect(LEFT, barsTop,      contentW, 22, SEM_COLORS[5]);
      txt('SERVICIO COMUNITARIO   TH: 60 horas', LEFT, barsTop + 7, contentW, 7.5, '#FFFFFF', { align: 'center' });

      fillRect(LEFT, barsTop + 26, contentW, 22, SEM_COLORS[7]);
      txt('PRÁCTICAS LABORALES   TH: 240 horas', LEFT, barsTop + 33, contentW, 7.5, '#FFFFFF', { align: 'center' });

      // ── Right sidebar ─────────────────────────────────────────────────────
      const sx = LEFT + contentW + 8;
      const sw = RIGHT_W - 12;

      // Legend title
      fillRect(sx, HEADER_H + 2, sw, 16, DARK_PURPLE);
      txt('LEYENDA', sx, HEADER_H + 7, sw, 7, '#FFFFFF', { bold: true, align: 'center' });

      // Sample card
      const lcY = HEADER_H + 22;
      doc.rect(sx, lcY, sw, 44).fill('#FFFFFF').stroke(CARD_BORDER);
      fillRect(sx, lcY, sw, HDR_H, SEM_COLORS[0]);
      txt('Nombre de la asignatura', sx, lcY + 9,  sw, 8,   CREAM, { align: 'center', bold: true });
      txt('← Código',               sx + 2, lcY + HDR_H + 6, sw / 2, 7, SECONDARY);
      txt('3 CR →', sx + sw / 2 - 2, lcY + HDR_H + 6, sw / 2, 7, SECONDARY, { bold: true, align: 'right' });
      fillRect(sx, lcY + 34, sw, 10, FOOTER_BG);
      txt('CC: XXh  ·  TH: XXXh', sx, lcY + 37, sw, 5.5, SECONDARY, { align: 'center' });

      // Semester color legend
      const clY = lcY + 58;
      txt('COLORES POR SEMESTRE:', sx, clY, sw, 6.5, SECONDARY, { bold: true });
      for (let i = 0; i < nSems; i++) {
        const ly = clY + 14 + i * 13;
        fillRect(sx, ly, 9, 9, SEM_COLORS[i % SEM_COLORS.length]);
        txt(`Semestre ${i + 1}`, sx + 13, ly + 1, sw - 14, 7, SECONDARY);
      }

      // Summary table
      const sumY = PAGE_H - FOOTER_LINE - 95;
      fillRect(sx, sumY - 16, sw, 16, DARK_PURPLE);
      txt('RESUMEN ORGANIZACIÓN DEL APRENDIZAJE', sx, sumY - 12, sw, 6, '#FFFFFF', { bold: true, align: 'center' });

      const c4 = sw / 4;
      fillRect(sx, sumY, sw, 24, FOOTER_BG);
      [['Contacto\nDocente', 0], ['Autónomo', 1], ['Práct.\ny Serv.', 2], ['TOTAL', 3]].forEach(([h, i]) => {
        const hStr = String(h).replace('\n', ' ');
        txt(hStr, sx + Number(i) * c4, sumY + 7, c4, 5.5, SECONDARY, { align: 'center' });
      });

      fillRect(sx, sumY + 24, sw, 20, '#FFFFFF');
      doc.rect(sx, sumY + 24, sw, 20).stroke(CARD_BORDER);
      [totalCC, totalAuto, totalServ, totalCC + totalAuto + totalServ].forEach((v, i) => {
        txt(String(v), sx + i * c4, sumY + 30, c4, 10, DARK_PURPLE, { bold: true, align: 'center' });
      });

      // ── Footer ────────────────────────────────────────────────────────────
      fillRect(0, PAGE_H - FOOTER_LINE, PAGE_W, FOOTER_LINE, DARK_PURPLE);
      txt(
        `${uniName}  ·  ${curriculum.career.name}  ·  Versión ${curriculum.version}  ·  Malla Curricular 2025`,
        10, PAGE_H - 14, PAGE_W / 2, 6.5, CREAM
      );
      txt('Resolución de Aprobación: RPC-SO-2025', PAGE_W / 2, PAGE_H - 14, PAGE_W / 2 - 10, 6.5, CREAM, { align: 'right' });

      doc.end();
    });
  }
}
