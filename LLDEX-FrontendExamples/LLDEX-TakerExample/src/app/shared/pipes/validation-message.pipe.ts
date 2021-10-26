import { Pipe, PipeTransform } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

@Pipe({
  name: 'validationMessage'
})
export class ValidationMessagePipe implements PipeTransform {

  transform(value: ValidationErrors): string {
    if (value.sellTokenBalance) return "Balance exceeded";
    return "";
  }

}
