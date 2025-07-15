import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateComboDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    required: true,
    description: 'Unique code for the combo',
  })
  comboCode: string;
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    required: true,
    description: 'Name of the combo',
  })
  comboName: string;
  @IsString()
  @ApiProperty({
    type: String,
    required: false,
    description: 'Description of the combo',
  })
  description?: string;
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    required: true,
    description: 'ID of the major associated with the combo',
  })
  majorId: string; // Assuming majorId is a string representing the ObjectId of the
}
