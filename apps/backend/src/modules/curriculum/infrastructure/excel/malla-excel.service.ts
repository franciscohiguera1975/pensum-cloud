import { Injectable, NotFoundException } from '@nestjs/common';
// exceljs uses CommonJS exports (module.exports.Workbook), so use import= to avoid .default wrapping
import ExcelJS = require('exceljs');
import { PrismaService } from '@shared/infrastructure/database/prisma.service';

// ── Semester color palette (hex, no #) ────────────────────────────────────────
const SEM_COLORS = [
  'BE2F00', // S1 red-orange
  '38DA54', // S2 green
  'AF8103', // S3 gold
  '4057C8', // S4 blue
  'B503D9', // S5 purple
  '00A6D1', // S6 teal
  '1A8C38', // S7 forest green
  '0D2DAD', // S8 navy
];

const DARK_PURPLE = '440054';
const CREAM       = 'E9C99E';
const WHITE       = 'FFFFFF';
const LIGHT_BG    = 'F9F6F3';
const FOOTER_BG   = 'F0EDE8';
const SECONDARY   = '9C7972';

@Injectable()
export class MallaExcelService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(curriculumId: string, tenantId: string): Promise<Buffer> {
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

    const uniName = curriculum.career.faculty.university.name;
    const facName = curriculum.career.faculty.name;
    const carName = curriculum.career.name;
    const nSems   = curriculum.semesters.length;

    const workbook  = new ExcelJS.Workbook();
    workbook.creator = 'Pensum Cloud';
    workbook.created = new Date();

    // ── Sheet 1: Malla (grid view) ───────────────────────────────────────────
    this.buildMallaSheet(workbook, curriculum, uniName, facName, carName, nSems);

    // ── Sheet 2: Detalle de Asignaturas ─────────────────────────────────────
    this.buildDetalleSheet(workbook, curriculum, uniName, facName, carName);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ── Sheet 1: grid layout ────────────────────────────────────────────────────
  private buildMallaSheet(
    workbook: ExcelJS.Workbook,
    curriculum: any,
    uniName: string,
    facName: string,
    carName: string,
    nSems: number,
  ): void {
    const ws = workbook.addWorksheet('Malla Curricular', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 4 }],
    });

    // Each semester = 5 columns: Code | Name | Cr | CC h | TH h
    // Column layout: row labels in col A, then 5 cols per semester
    const SEM_COLS = 5;
    const totalCols = 1 + nSems * SEM_COLS;

    // ── Column widths ──────────────────────────────────────────────────────
    ws.getColumn(1).width = 18; // row label
    for (let s = 0; s < nSems; s++) {
      const base = 2 + s * SEM_COLS;
      ws.getColumn(base).width     = 10; // Code
      ws.getColumn(base + 1).width = 30; // Name
      ws.getColumn(base + 2).width = 6;  // Credits
      ws.getColumn(base + 3).width = 7;  // CC h
      ws.getColumn(base + 4).width = 7;  // TH h
    }

    // ── Row 1: institution header ─────────────────────────────────────────
    ws.mergeCells(1, 1, 1, totalCols);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = `MALLA CURRICULAR — ${carName.toUpperCase()}`;
    titleCell.font  = { bold: true, size: 14, color: { argb: `FF${WHITE}` } };
    titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK_PURPLE}` } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    // ── Row 2: sub-header (uni, faculty, version) ─────────────────────────
    ws.mergeCells(2, 1, 2, totalCols);
    const subCell = ws.getCell(2, 1);
    subCell.value = `${uniName}  ·  ${facName}  ·  Versión ${curriculum.version}`;
    subCell.font  = { size: 10, color: { argb: `FF${CREAM}` } };
    subCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK_PURPLE}` } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 18;

    // ── Row 3: semester header columns ────────────────────────────────────
    ws.getCell(3, 1).value = '';
    ws.getRow(3).height = 22;

    for (let s = 0; s < nSems; s++) {
      const sem   = curriculum.semesters[s];
      const color = SEM_COLORS[s % SEM_COLORS.length];
      const base  = 2 + s * SEM_COLS;

      ws.mergeCells(3, base, 3, base + SEM_COLS - 1);
      const semCell = ws.getCell(3, base);
      semCell.value = sem.name ?? `Semestre ${sem.number}`;
      semCell.font  = { bold: true, size: 11, color: { argb: `FF${WHITE}` } };
      semCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${color}` } };
      semCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // ── Row 4: sub-column headers ─────────────────────────────────────────
    ws.getCell(4, 1).value = 'Asignatura';
    this.styleHeader(ws.getCell(4, 1), LIGHT_BG, SECONDARY);
    ws.getRow(4).height = 16;

    for (let s = 0; s < nSems; s++) {
      const base    = 2 + s * SEM_COLS;
      const headers = ['Código', 'Nombre', 'Cr', 'CC h', 'TH h'];
      headers.forEach((h, i) => {
        const cell = ws.getCell(4, base + i);
        cell.value = h;
        this.styleHeader(cell, FOOTER_BG, SECONDARY);
      });
    }

    // ── Rows 5+: subjects ─────────────────────────────────────────────────
    const maxSubs = Math.max(...curriculum.semesters.map((s: any) => s.subjects.length), 0);

    for (let r = 0; r < maxSubs; r++) {
      const rowIdx = 5 + r;
      ws.getRow(rowIdx).height = 28;

      // Row label (subject #)
      const labelCell = ws.getCell(rowIdx, 1);
      labelCell.value = `Materia ${r + 1}`;
      labelCell.font  = { size: 9, color: { argb: `FF${SECONDARY}` } };
      labelCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FFF9F6F3` } };
      labelCell.alignment = { vertical: 'middle' };

      for (let s = 0; s < nSems; s++) {
        const sem   = curriculum.semesters[s];
        const color = SEM_COLORS[s % SEM_COLORS.length];
        const sub   = sem.subjects[r];
        const base  = 2 + s * SEM_COLS;

        if (!sub) {
          // Empty cell — light fill
          for (let c = 0; c < SEM_COLS; c++) {
            ws.getCell(rowIdx, base + c).fill = {
              type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' },
            };
          }
          continue;
        }

        const cc = sub.hoursTheory + sub.hoursPractice;
        const th = cc + sub.credits * 32;

        // Colored code cell
        const codeCell = ws.getCell(rowIdx, base);
        codeCell.value = sub.code;
        codeCell.font  = { bold: true, size: 9, color: { argb: `FF${WHITE}` } };
        codeCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${color}` } };
        codeCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Name
        const nameCell = ws.getCell(rowIdx, base + 1);
        nameCell.value = sub.name;
        nameCell.font  = { size: 9 };
        nameCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FFFFFFFF` } };
        nameCell.alignment = { vertical: 'middle', wrapText: true };

        // Credits
        const crCell = ws.getCell(rowIdx, base + 2);
        crCell.value = sub.credits;
        crCell.font  = { bold: true, size: 9, color: { argb: `FF${DARK_PURPLE}` } };
        crCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FFFFFFFF` } };
        crCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // CC hours
        const ccCell = ws.getCell(rowIdx, base + 3);
        ccCell.value = cc;
        ccCell.font  = { size: 9 };
        ccCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FFFFFFFF` } };
        ccCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // TH hours
        const thCell = ws.getCell(rowIdx, base + 4);
        thCell.value = th;
        thCell.font  = { size: 9 };
        thCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FFFFFFFF` } };
        thCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Thin border around the 5 cells
        for (let c = 0; c < SEM_COLS; c++) {
          ws.getCell(rowIdx, base + c).border = {
            top:    { style: 'thin', color: { argb: 'FFD9B899' } },
            bottom: { style: 'thin', color: { argb: 'FFD9B899' } },
            left:   { style: 'thin', color: { argb: 'FFD9B899' } },
            right:  { style: 'thin', color: { argb: 'FFD9B899' } },
          };
        }
      }
    }

    // ── Totals row ────────────────────────────────────────────────────────
    const totalsRow = 5 + maxSubs + 1;
    ws.getRow(totalsRow).height = 20;
    ws.mergeCells(totalsRow, 1, totalsRow, 1);
    const totLabel = ws.getCell(totalsRow, 1);
    totLabel.value = 'TOTALES';
    totLabel.font  = { bold: true, size: 10, color: { argb: `FF${WHITE}` } };
    totLabel.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK_PURPLE}` } };
    totLabel.alignment = { horizontal: 'center', vertical: 'middle' };

    for (let s = 0; s < nSems; s++) {
      const sem  = curriculum.semesters[s];
      const base = 2 + s * SEM_COLS;
      const totCr = sem.subjects.reduce((a: number, su: any) => a + su.credits, 0);
      const totCC = sem.subjects.reduce((a: number, su: any) => a + su.hoursTheory + su.hoursPractice, 0);
      const totTH = sem.subjects.reduce((a: number, su: any) => a + su.hoursTheory + su.hoursPractice + su.credits * 32, 0);

      ws.mergeCells(totalsRow, base, totalsRow, base + 1);
      const nameCell = ws.getCell(totalsRow, base);
      nameCell.value = `${sem.subjects.length} mat.`;
      nameCell.font  = { bold: true, size: 9, color: { argb: `FF${WHITE}` } };
      nameCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK_PURPLE}` } };
      nameCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const crTot  = ws.getCell(totalsRow, base + 2);
      crTot.value  = totCr;
      crTot.font   = { bold: true, size: 9, color: { argb: `FF${WHITE}` } };
      crTot.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK_PURPLE}` } };
      crTot.alignment = { horizontal: 'center', vertical: 'middle' };

      const ccTot  = ws.getCell(totalsRow, base + 3);
      ccTot.value  = totCC;
      ccTot.font   = { bold: true, size: 9, color: { argb: `FF${WHITE}` } };
      ccTot.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK_PURPLE}` } };
      ccTot.alignment = { horizontal: 'center', vertical: 'middle' };

      const thTot  = ws.getCell(totalsRow, base + 4);
      thTot.value  = totTH;
      thTot.font   = { bold: true, size: 9, color: { argb: `FF${WHITE}` } };
      thTot.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK_PURPLE}` } };
      thTot.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  }

  // ── Sheet 2: flat table of all subjects ─────────────────────────────────────
  private buildDetalleSheet(
    workbook: ExcelJS.Workbook,
    curriculum: any,
    uniName: string,
    facName: string,
    carName: string,
  ): void {
    const ws = workbook.addWorksheet('Detalle de Asignaturas', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 5 }],
    });

    const cols = [
      { header: 'Semestre',           key: 'semNum',  width: 12 },
      { header: 'Nombre Semestre',    key: 'semName', width: 22 },
      { header: 'Código',             key: 'code',    width: 12 },
      { header: 'Nombre Asignatura',  key: 'name',    width: 40 },
      { header: 'Créditos',           key: 'credits', width: 10 },
      { header: 'Horas CD',           key: 'hcd',     width: 10 },
      { header: 'Horas PE',           key: 'hpe',     width: 10 },
      { header: 'Horas CC',           key: 'hcc',     width: 10 },
      { header: 'Horas Autónomas',    key: 'haut',    width: 16 },
      { header: 'Total Horas',        key: 'th',      width: 12 },
      { header: 'Descripción',        key: 'desc',    width: 50 },
    ];

    // ── Header rows ─────────────────────────────────────────────────────────
    const totalCols = cols.length;

    ws.mergeCells(1, 1, 1, totalCols);
    const t1 = ws.getCell(1, 1);
    t1.value = `DETALLE DE ASIGNATURAS — ${carName.toUpperCase()}`;
    t1.font  = { bold: true, size: 13, color: { argb: `FF${WHITE}` } };
    t1.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK_PURPLE}` } };
    t1.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 28;

    ws.mergeCells(2, 1, 2, totalCols);
    const t2 = ws.getCell(2, 1);
    t2.value = `${uniName}  ·  ${facName}  ·  Versión ${curriculum.version}`;
    t2.font  = { size: 10, color: { argb: `FF${CREAM}` } };
    t2.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK_PURPLE}` } };
    t2.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 18;

    // blank separator
    ws.getRow(3).height = 6;

    // ── Column headers ───────────────────────────────────────────────────────
    ws.getRow(4).height = 18;
    ws.columns = cols.map((c) => ({ width: c.width }));
    cols.forEach((col, i) => {
      const cell = ws.getCell(4, i + 1);
      cell.value = col.header;
      cell.font  = { bold: true, size: 10, color: { argb: `FF${WHITE}` } };
      cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK_PURPLE}` } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: `FF${CREAM}` } },
      };
    });

    // ── Data rows ────────────────────────────────────────────────────────────
    let rowIdx = 5;
    for (const sem of curriculum.semesters) {
      const semColor = SEM_COLORS[(sem.number - 1) % SEM_COLORS.length];
      const semName  = sem.name ?? `Semestre ${sem.number}`;

      for (const sub of sem.subjects) {
        const cc   = sub.hoursTheory + sub.hoursPractice;
        const haut = sub.credits * 32;
        const th   = cc + haut;

        const row = ws.getRow(rowIdx);
        row.height = 20;

        const values = [
          sem.number,
          semName,
          sub.code,
          sub.name,
          sub.credits,
          sub.hoursTheory,
          sub.hoursPractice,
          cc,
          haut,
          th,
          sub.description ?? '',
        ];

        values.forEach((val, i) => {
          const cell = ws.getCell(rowIdx, i + 1);
          cell.value = val;
          cell.font  = { size: 10 };
          cell.alignment = { vertical: 'middle', wrapText: i === 3 || i === 10 };

          // Semester number cell — colored
          if (i === 0) {
            cell.font = { bold: true, size: 10, color: { argb: `FF${WHITE}` } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${semColor}` } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (i === 2) {
            // code cell
            cell.font = { bold: true, size: 10 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FFEFF6FF` } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (i >= 4 && i <= 9) {
            // numeric cells
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            if (i === 4) {
              cell.font = { bold: true, size: 10, color: { argb: `FF${DARK_PURPLE}` } };
            }
          }

          cell.border = {
            top:    { style: 'hair', color: { argb: 'FFD9D9D9' } },
            bottom: { style: 'hair', color: { argb: 'FFD9D9D9' } },
            left:   { style: 'hair', color: { argb: 'FFD9D9D9' } },
            right:  { style: 'hair', color: { argb: 'FFD9D9D9' } },
          };
        });

        // Alternating row background (skip col 0 which has semester color)
        if (rowIdx % 2 === 0) {
          for (let c = 2; c <= totalCols; c++) {
            const cell = ws.getCell(rowIdx, c);
            if (!cell.fill || (cell.fill as any).fgColor?.argb === 'FFFFFFFF' || !(cell.fill as any).fgColor) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F6F3' } };
            }
          }
        }

        rowIdx++;
      }
    }

    // ── Auto-filter on header row ─────────────────────────────────────────────
    ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: rowIdx - 1, column: totalCols } };
  }

  private styleHeader(cell: ExcelJS.Cell, bgHex: string, fgHex: string): void {
    cell.font      = { bold: true, size: 9, color: { argb: `FF${fgHex}` } };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bgHex}` } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
}
